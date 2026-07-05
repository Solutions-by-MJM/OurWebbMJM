// Formulário de contacto simples (sem calendário)
(function () {
  const STRINGS = {
    "pt-PT": {
      submitting: "A enviar…",
      success: "Mensagem enviada. Responderemos em breve.",
      error: "Não foi possível enviar. Tente outra vez.",
    },
    en: {
      submitting: "Sending…",
      success: "Message sent. We'll respond shortly.",
      error: "We couldn't send your message. Please try again.",
    },
  };

  function t(key) {
    const lang = document.documentElement.lang === "en" ? "en" : "pt-PT";
    return STRINGS[lang][key];
  }

  const statusEl = document.getElementById("booking-status");
  const formEl = document.getElementById("booking-form");
  const attendeeForm = document.getElementById("booking-attendee-form");
  const msgEl = document.getElementById("booking-msg");

  if (!statusEl) return;
  statusEl.style.display = "none";

  if (formEl) formEl.style.display = "flex";

  if (attendeeForm) {
    attendeeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById("booking-submit");
      const name = document.getElementById("bk-nome").value.trim();
      const email = document.getElementById("bk-email").value.trim();
      const company = document.getElementById("bk-empresa").value.trim();
      const notes = document.getElementById("bk-notas").value.trim();
      const language = document.documentElement.lang === "en" ? "en" : "pt";
      var websiteField = document.getElementById("bk-website");
      var website = websiteField ? websiteField.value : "";

      submitBtn.disabled = true;
      msgEl.textContent = t("submitting");

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, notes, language, website }),
      })
        .then(async (r) => {
          const body = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(body.error || t("error"));
          attendeeForm.reset();
          msgEl.textContent = t("success");
          msgEl.style.color = "var(--accent)";
        })
        .catch((err) => {
          submitBtn.disabled = false;
          msgEl.textContent = err.message || t("error");
        });
    });
  }
})();
