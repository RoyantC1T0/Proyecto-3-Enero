import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

interface ClosureRecord {
  closure_id: number;
  closure_date: string;
  total_income: number;
  total_expenses: number;
  net_balance: number;
}

// POST - Close the current balance period
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the last closure date
    const lastClosure = await queryOne<{ closure_date: string }>(
      `SELECT closure_date FROM month_closures WHERE user_id = $1 ORDER BY closure_date DESC LIMIT 1`,
      [auth.userId],
    );

    // Calculate totals from the last closure until now
    let statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN base_amount ELSE 0 END), 0) as expenses,
        COUNT(*) as transaction_count
       FROM transactions
       WHERE user_id = $1`;

    const params: (number | string)[] = [auth.userId];

    if (lastClosure?.closure_date) {
      statsQuery += ` AND created_at > $2`;
      params.push(lastClosure.closure_date);
    }

    const currentStats = await queryOne<{
      income: string;
      expenses: string;
      transaction_count: string;
    }>(statsQuery, params);

    const income = parseFloat(currentStats?.income || "0");
    const expenses = parseFloat(currentStats?.expenses || "0");
    const transactionCount = parseInt(currentStats?.transaction_count || "0");

    // Get monthly base income
    const userPrefs = await queryOne<{ monthly_income: number | null }>(
      `SELECT monthly_income FROM user_preferences WHERE user_id = $1`,
      [auth.userId],
    );
    const monthlyIncome = Number(userPrefs?.monthly_income) || 0;

    // Calculate accumulated balance from all previous closures
    const accumulatedResult = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(net_balance), 0) as total FROM month_closures WHERE user_id = $1`,
      [auth.userId],
    );
    const previousAccumulated = parseFloat(accumulatedResult?.total || "0");

    // Create closure record
    const closureDate = new Date();
    const monthYear = `${closureDate.getFullYear()}-${String(closureDate.getMonth() + 1).padStart(2, "0")}-01`;
    const netBalance = income + monthlyIncome - expenses;

    await query(
      `INSERT INTO month_closures (
        user_id, month_year, closure_date, total_income, total_expenses, 
        net_balance, total_savings, currency_code, accumulated_balance, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, 'USD', $7, $8)`,
      [
        auth.userId,
        monthYear,
        closureDate.toISOString(),
        income + monthlyIncome,
        expenses,
        netBalance,
        previousAccumulated + netBalance,
        `Cierre de balance - ${closureDate.toLocaleDateString("es-AR")}`,
      ],
    );

    return NextResponse.json({
      success: true,
      closed_at: closureDate.toISOString(),
      summary: {
        total_income: income + monthlyIncome,
        total_expenses: expenses,
        net_balance: netBalance,
        transactions_count: transactionCount,
        accumulated_balance: previousAccumulated + netBalance,
      },
    });
  } catch (error) {
    console.error("Close balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET - Get closure history
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const closures = await queryMany<ClosureRecord>(
      `SELECT closure_id, closure_date, total_income, total_expenses, net_balance, accumulated_balance
       FROM month_closures WHERE user_id = $1 ORDER BY closure_date DESC LIMIT 12`,
      [auth.userId],
    );

    return NextResponse.json({ closures });
  } catch (error) {
    console.error("Get closures error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
