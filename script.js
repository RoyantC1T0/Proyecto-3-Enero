import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, update, set, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "apple-finance-93f39.firebaseapp.com",
  databaseURL: "https://apple-finance-93f39-default-rtdb.firebaseio.com",
  projectId: "apple-finance-93f39",
  storageBucket: "apple-finance-93f39.appspot.com",
  messagingSenderId: "TU_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 2. ESCUDO DE SEGURIDAD (Se ejecuta antes que nada) ---
const loggedUser = sessionStorage.getItem("loggedUser");
const path = window.location.pathname;
const esPaginaPublica = path.includes("index.html") || path === "/";

// Bloqueo: Si no hay usuario y quiere entrar a una página privada
if (!loggedUser && !esPaginaPublica) {
    window.location.replace("index.html");
}

// Bloqueo: Si YA está logueado y quiere volver al login (lo mandamos a su panel)
if (loggedUser && esPaginaPublica) {
    window.location.replace("pag1.html");
}

document.addEventListener("DOMContentLoaded", async () => {

    // --- A. LÓGICA DEL OJITO (MOSTRAR CLAVE) ---
    const ojito = document.getElementById("ojito");
    const passInput = document.getElementById("password");
    if (ojito && passInput) {
        ojito.addEventListener("click", () => {
            const isPass = passInput.type === "password";
            passInput.type = isPass ? "text" : "password";
            ojito.classList.toggle("active");
        });
    }

    // --- B. REGISTRO AUTOMÁTICO + BONO $4.00 ---
    const modalReg = document.getElementById("modalRegistro");
    const regForm = document.getElementById("regForm");
    
    if (document.getElementById("openReg")) document.getElementById("openReg").onclick = () => modalReg.style.display = "flex";
    if (document.getElementById("closeReg")) document.getElementById("closeReg").onclick = () => modalReg.style.display = "none";

    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const user = document.getElementById("regUser").value.trim();
            const pass = document.getElementById("regPass").value.trim();
            
            const check = await get(ref(db, `usuarios/${user}`));
            if (check.exists()) {
                alert("Este nombre de usuario ya está en uso.");
            } else {
                await set(ref(db, `usuarios/${user}`), { pass, saldo: 4.0, admin: false });
                await push(ref(db, `usuarios/${user}/historial`), {
                    fecha: new Date().toLocaleDateString(),
                    detalle: "Bono de bienvenida",
                    monto: "+$4.00"
                });
                alert("¡Registro exitoso! Ya puedes iniciar sesión.");
                location.reload();
            }
        });
    }

    // --- C. LOGIN ---
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const u = document.getElementById("phone").value.trim();
            const p = document.getElementById("password").value.trim();
            const snap = await get(ref(db, `usuarios/${u}`));
            
            if (snap.exists() && snap.val().pass.toString() === p) {
                sessionStorage.setItem("loggedUser", u);
                // Usamos replace para que no pueda volver atrás al login
                if (snap.val().admin) {
                    window.location.replace("admin.html");
                } else {
                    sessionStorage.setItem("showModal", "true");
                    window.location.replace("pag1.html");
                }
            } else {
                const msg = document.getElementById("message");
                msg.innerText = "Usuario o contraseña incorrectos";
                msg.style.color = "#ff453a";
            }
        });
    }

    // --- D. CARGA DE DATOS (SALDO Y NOMBRE) ---
    if (loggedUser) {
        const snap = await get(ref(db, `usuarios/${loggedUser}`));
        if (snap.exists()) {
            if (document.getElementById("username")) document.getElementById("username").innerText = loggedUser;
            if (document.getElementById("saldo")) document.getElementById("saldo").innerText = snap.val().saldo.toFixed(2);
            
            // Cargar Historial
            const tablaH = document.getElementById("listaHistorial");
            if (tablaH && snap.val().historial) {
                const hist = snap.val().historial;
                tablaH.innerHTML = "";
                Object.values(hist).reverse().forEach(m => {
                    const esPositivo = m.monto.includes("+");
                    tablaH.innerHTML += `
                        <tr style="border-bottom: 1px solid #222;">
                            <td style="padding: 12px; color: #888; font-size: 12px;">${m.fecha}</td>
                            <td style="padding: 12px;">${m.detalle}</td>
                            <td style="padding: 12px; text-align: right; color: ${esPositivo ? '#30d158' : '#ff453a'}; font-weight: bold;">${m.monto}</td>
                        </tr>`;
                });
            }
        }
    }

    // --- E. SISTEMA DE COMPRA ---
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = async () => {
            const precio = parseFloat(btn.getAttribute('data-price'));
            const nombreP = btn.getAttribute('data-name');
            const userSnap = await get(ref(db, `usuarios/${loggedUser}`));
            
            if (userSnap.exists() && userSnap.val().saldo >= precio) {
                const nuevoSaldo = userSnap.val().saldo - precio;
                await update(ref(db, `usuarios/${loggedUser}`), { saldo: nuevoSaldo });
                await push(ref(db, `usuarios/${loggedUser}/historial`), {
                    fecha: new Date().toLocaleDateString(),
                    detalle: `Inversión: ${nombreP}`,
                    monto: `-$${precio.toFixed(2)}`
                });
                alert("Inversión exitosa");
                location.reload();
            } else {
                alert("Saldo insuficiente");
            }
        };
    });

    // --- F. PANEL ADMIN ---
    const tableAdmin = document.getElementById("userTable");
    if (tableAdmin) {
        const snap = await get(ref(db, "usuarios"));
        const users = snap.val();
        tableAdmin.innerHTML = "";
        for (let id in users) {
            if (users[id].admin) continue;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${id}</td>
                <td style="color: #30d158;">$${parseFloat(users[id].saldo).toFixed(2)}</td>
                <td>
                    <input type="number" id="input-${id}" style="width:70px; margin:0;">
                    <button class="save-btn" data-id="${id}" style="width:auto; padding:5px 10px; background:#007aff; margin:0;">OK</button>
                </td>
            `;
            tableAdmin.appendChild(row);

            // --- BOTÓN DE BONO GLOBAL ($1.00 A TODOS) ---
const btnGlobal = document.getElementById("btnBonoGlobal");
if (btnGlobal) {
    btnGlobal.onclick = async () => {
        const confirmar = confirm("¿Estás seguro de que quieres sumar $1.00 a TODOS los usuarios?");
        
        if (confirmar) {
            btnGlobal.innerText = "Procesando...";
            btnGlobal.disabled = true;

            const snap = await get(ref(db, "usuarios"));
            if (snap.exists()) {
                const usuarios = snap.val();
                const promesas = []; // Guardaremos todas las actualizaciones aquí

                for (let id in usuarios) {
                    // Evitamos darle dinero a la cuenta de admin
                    if (usuarios[id].admin) continue;

                    const saldoActual = parseFloat(usuarios[id].saldo || 0);
                    const nuevoSaldo = saldoActual + 1.0;

                    // 1. Actualizar el saldo
                    const updateSaldo = update(ref(db, `usuarios/${id}`), {
                        saldo: nuevoSaldo
                    });

                    // 2. Registrar en el historial de cada usuario
                    const regHistorial = push(ref(db, `usuarios/${id}/historial`), {
                        fecha: new Date().toLocaleDateString(),
                        detalle: "Bono Global Diario",
                        monto: "+$1.00"
                    });

                    promesas.push(updateSaldo, regHistorial);
                }

                // Esperamos a que todas las actualizaciones terminen
                await Promise.all(promesas);
                alert("¡Éxito! Se ha sumado $1.00 a todos los usuarios.");
                location.reload();
            }
        }
    };
}
        }
        document.querySelectorAll(".save-btn").forEach(b => {
            b.onclick = async () => {
                const uid = b.getAttribute("data-id");
                const v = document.getElementById(`input-${uid}`).value;
                if(v) {
                    await update(ref(db, `usuarios/${uid}`), { saldo: parseFloat(v) });
                    location.reload();
                }
            };
        });
    }

    // --- G. CERRAR SESIÓN (LOGOUT) ---
    const btnSalir = document.getElementById("logoutBtn") || document.getElementById("logoutBtnAdmin");
    if (btnSalir) {
        btnSalir.onclick = () => {
            sessionStorage.clear();
            // window.location.replace limpia el historial para que no puedan volver atrás
            window.location.replace("index.html");
        };
    }

    // --- H. MODAL BIENVENIDA ---
    const welcome = document.getElementById("overlay");
    if (welcome && sessionStorage.getItem("showModal")) {
        welcome.style.display = "flex";
        sessionStorage.removeItem("showModal");
    }
    if (document.getElementById("closeBtn")) {
        document.getElementById("closeBtn").onclick = () => welcome.style.display = "none";
    }
});

// FUNCIONES GLOBALES
window.recargar = () => window.open("https://t.me/TU_USUARIO", "_blank");