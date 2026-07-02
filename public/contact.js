// Formulário de contactos: enquanto não há backend (Resend), abre o email
// pré-preenchido. Ligado por addEventListener (sem inline) para permitir
// uma CSP com script-src 'self' — sem 'unsafe-inline'.
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = document.getElementById("nome").value.trim();
    var email = document.getElementById("email").value.trim();
    var empresa = document.getElementById("empresa").value.trim();
    var problema = document.getElementById("problema").value.trim();
    var corpo =
      "Nome: " + nome + "\n" +
      "Email: " + email + "\n" +
      (empresa ? "Empresa: " + empresa + "\n" : "") +
      "\nProblema:\n" + problema + "\n";
    var assunto = "Pedido de diagnóstico — " + (empresa || nome);
    window.location.href =
      "mailto:ola@mjmsolutions.pt?subject=" +
      encodeURIComponent(assunto) +
      "&body=" +
      encodeURIComponent(corpo);
    document.getElementById("form-msg").textContent =
      "A abrir o seu email… se não abrir, escreva para ola@mjmsolutions.pt. Respondemos em 1 dia útil.";
  });
});
