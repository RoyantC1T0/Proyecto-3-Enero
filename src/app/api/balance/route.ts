import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getBlueRate } from "@/lib/currency";

// GET - Get current balance (calculated from transactions since last closure)
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the last closure date
    const lastClosure = await queryOne<{
      closure_date: string;
      accumulated_balance: string;
    }>(
      `SELECT closure_date, accumulated_balance FROM month_closures WHERE user_id = $1 ORDER BY closure_date DESC LIMIT 1`,
      [auth.userId],
    );

    // Build query to get transactions since last closure (or all if no closure exists)
    let statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN base_amount ELSE 0 END), 0) as expenses
       FROM transactions
       WHERE user_id = $1`;

    const params: (number | string)[] = [auth.userId];

    if (lastClosure?.closure_date) {
      statsQuery += ` AND created_at > $2`;
      params.push(lastClosure.closure_date);
    }

    const monthlyStats = await queryOne<{
      income: string;
      expenses: string;
    }>(statsQuery, params);

    const previousAccumulated = parseFloat(
      lastClosure?.accumulated_balance || "0",
    );

    // Get user's monthly base income from preferences
    const userPrefs = await queryOne<{ monthly_income: number | null }>(
      `SELECT monthly_income FROM user_preferences WHERE user_id = $1`,
      [auth.userId],
    );

    // Get Blue Dollar rate for ARS conversion
    let arsRate = 1;
    let blueRateInfo = null;
    try {
      const blueRate = await getBlueRate();
      arsRate = blueRate.venta;
      blueRateInfo = blueRate;
    } catch (error) {
      console.warn("Could not fetch Blue Dollar rate, using fallback:", error);
      arsRate = 1;
    }

    const monthlyBaseIncome = Number(userPrefs?.monthly_income) || 0;
    const transactionIncome = parseFloat(monthlyStats?.income || "0");
    const expenses = parseFloat(monthlyStats?.expenses || "0");
    const totalIncome = transactionIncome + monthlyBaseIncome;
    const netBalance = totalIncome - expenses;

    // Calculate total savings
    const savingsResult = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(base_amount), 0) as total FROM savings_contributions WHERE user_id = $1`,
      [auth.userId],
    );
    const totalSavings = parseFloat(savingsResult?.total || "0");

    return NextResponse.json({
      current_month_income: totalIncome,
      current_month_expenses: expenses,
      current_month_balance: netBalance,
      monthly_base_income: monthlyBaseIncome,
      extra_income: transactionIncome,
      total_savings: totalSavings,
      accumulated_balance: previousAccumulated,
      last_closure_date: lastClosure?.closure_date || null,
      currency_code: "USD",
      conversions: {
        USD: {
          income: totalIncome,
          expenses,
          balance: netBalance,
          savings: totalSavings,
        },
        ARS: {
          income: totalIncome * arsRate,
          expenses: expenses * arsRate,
          balance: netBalance * arsRate,
          savings: totalSavings * arsRate,
        },
      },
      exchange_rate: {
        USD_to_ARS: arsRate,
        blue_dollar: blueRateInfo,
        updated_at: new Date().toISOString(),
      },
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Set monthly income
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { monthly_income } = body;

    if (monthly_income === undefined || monthly_income < 0) {
      return NextResponse.json(
        { error: "Invalid monthly income" },
        { status: 400 },
      );
    }

    // Update user preferences
    await query(
      `UPDATE user_preferences SET monthly_income = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2`,
      [monthly_income, auth.userId],
    );

    // Recalculate balance
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    await query(
      `UPDATE user_balance_cache SET
        current_month_balance = COALESCE((
          SELECT SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE -base_amount END)
          FROM transactions 
          WHERE user_id = $1 
          AND transaction_date >= $2::date AND transaction_date < ($2::date + INTERVAL '1 month')
        ), 0) + $3,
        last_updated = CURRENT_TIMESTAMP
      WHERE user_id = $1`,
      [auth.userId, monthStartStr, monthly_income],
    );

    return NextResponse.json({ success: true, monthly_income });
  } catch (error) {
    console.error("Set monthly income error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
