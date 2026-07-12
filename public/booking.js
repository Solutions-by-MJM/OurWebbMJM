// Formulário de contacto simples (sem calendário)
(function () {
  const STRINGS = {
    "pt-PT": {
      submitting: "A enviar…",
      success: "Mensagem enviada. Responderemos em breve.",
      error: "Não foi possível enviar. Tente outra vez.",
      name_required: "Indique o seu nome.",
      name_short: "O nome deve ter pelo menos 2 caracteres.",
      email_required: "Indique o seu email.",
      email_invalid: "Indique um endereço de email válido.",
      notes_required: "Descreva o problema.",
      notes_short: "Descreva o problema com um pouco mais de detalhe (mín. 10 caracteres).",
    },
    en: {
      submitting: "Sending…",
      success: "Message sent. We'll respond shortly.",
      error: "We couldn't send your message. Please try again.",
      name_required: "Please enter your name.",
      name_short: "Name must be at least 2 characters.",
      email_required: "Please enter your email.",
      email_invalid: "Please enter a valid email address.",
      notes_required: "Please describe the problem.",
      notes_short: "Please add a little more detail (min. 10 characters).",
    },
  };

  function t(key) {
    const lang = document.documentElement.lang === "en" ? "en" : "pt-PT";
    return STRINGS[lang][key];
  }

  // Mesmas regras que o servidor valida em /api/contact — validar aqui é só para
  // dar feedback imediato; a fonte da verdade continua a ser o servidor.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const VALIDATORS = {
    "bk-nome": function (v) {
      if (!v) return "name_required";
      if (v.length < 2) return "name_short";
      return null;
    },
    "bk-email": function (v) {
      if (!v) return "email_required";
      if (!EMAIL_RE.test(v)) return "email_invalid";
      return null;
    },
    "bk-notas": function (v) {
      if (!v) return "notes_required";
      if (v.length < 10) return "notes_short";
      return null;
    },
  };

  const attendeeForm = document.getElementById("booking-attendee-form");
  const msgEl = document.getElementById("booking-msg");

  // Guardar apenas nos elementos que realmente usamos. Antes havia aqui um
  // guard em #booking-status — elemento que deixou de existir no HTML quando o
  // formulário foi simplificado — e que abortava o script inteiro, deixando o
  // submit nativo recarregar a página sem nunca chamar /api/contact.
  if (!attendeeForm || !msgEl) return;

  // Mostra ou limpa a mensagem de erro de um campo, marcando o .field2 e
  // inserindo/atualizando um <p class="field-error"> a seguir ao input.
  function setFieldError(id, errorKey) {
    const input = document.getElementById(id);
    if (!input) return;
    const field = input.closest(".field2");
    if (!field) return;
    let errEl = field.querySelector(".field-error");
    if (errorKey) {
      if (!errEl) {
        errEl = document.createElement("p");
        errEl.className = "field-error";
        errEl.id = id + "-error";
        field.appendChild(errEl);
      }
      errEl.textContent = t(errorKey);
      field.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", errEl.id);
    } else {
      field.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
      if (errEl) errEl.remove();
    }
  }

  function validateField(id) {
    const input = document.getElementById(id);
    const errorKey = VALIDATORS[id](input.value.trim());
    setFieldError(id, errorKey);
    return !errorKey;
  }

  // Valida ao sair do campo; depois de haver um erro, revalida enquanto o
  // utilizador escreve para que a mensagem desapareça assim que fica correto.
  Object.keys(VALIDATORS).forEach(function (id) {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("blur", function () {
      validateField(id);
    });
    input.addEventListener("input", function () {
      if (input.closest(".field2").classList.contains("has-error")) validateField(id);
    });
  });

  if (attendeeForm) {
    attendeeForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Valida todos os campos; se algum falhar, foca o primeiro e não envia.
      let firstInvalid = null;
      Object.keys(VALIDATORS).forEach(function (id) {
        if (!validateField(id) && !firstInvalid) firstInvalid = id;
      });
      if (firstInvalid) {
        msgEl.textContent = "";
        document.getElementById(firstInvalid).focus();
        return;
      }

      const submitBtn = document.getElementById("booking-submit");
      const name = document.getElementById("bk-nome").value.trim();
      const email = document.getElementById("bk-email").value.trim();
      const company = document.getElementById("bk-empresa").value.trim();
      const notes = document.getElementById("bk-notas").value.trim();
      const language = document.documentElement.lang === "en" ? "en" : "pt";
      var websiteField = document.getElementById("bk-website");
      var website = websiteField ? websiteField.value : "";

      submitBtn.disabled = true;
      msgEl.style.color = "var(--ink-2)";
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
          msgEl.style.color = "var(--danger)";
          msgEl.textContent = err.message || t("error");
        });
    });
  }
})();
