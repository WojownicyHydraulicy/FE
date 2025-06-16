document.addEventListener("DOMContentLoaded", function () {
    // Sprawdź czy używamy urządzenia mobilnego
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    // Dodaj klasę do body w przypadku urządzenia mobilnego
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }
    
    // Pobierz miasta i wstaw do selecta
    fetch("https://orders-management-api-409909044870.europe-central2.run.app/fetch_cities/")
        .then(res => res.json())
        .then(data => {
            if (data.status === "success" && Array.isArray(data.cities)) {
                const citySelect = document.getElementById("citySelect");
                data.cities.forEach(city => {
                    const opt = document.createElement("option");
                    opt.value = city;
                    opt.textContent = city;
                    citySelect.appendChild(opt);
                });
            }
        });

    // Obsługa pól faktury – widoczność zależna od wybranej opcji w "Dokument sprzedaży"
    const salesDocumentSelect = document.getElementById("salesDocumentSelect");
    const invoiceFields = document.getElementById("invoiceFields");
    function setInvoiceFieldsRequired(isRequired) {
        const inputs = invoiceFields.querySelectorAll("input");
        inputs.forEach(input => {
            input.required = isRequired;
        });
    }
    salesDocumentSelect.addEventListener("change", function() {
        if (this.value === "Faktura") {
            invoiceFields.style.display = "block";
            setInvoiceFieldsRequired(true);
            
            // Na urządzeniach mobilnych, przewiń do widocznych pól po zmianie
            if (isMobile) {
                setTimeout(() => {
                    invoiceFields.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } else {
            invoiceFields.style.display = "none";
            setInvoiceFieldsRequired(false);
            // Czyszczenie danych
            invoiceFields.querySelectorAll("input").forEach(input => {
                input.value = "";
            });
        }
    });

    // Obsługa formularza
    const form = document.getElementById("orderForm");
    const submitBtn = document.getElementById("submitBtn");
    const overlaySpinner = document.getElementById("overlaySpinner");
    const overlayModal   = document.getElementById("overlayModal");
    const modalMessage   = document.getElementById("modalMessage");
    const modalClose     = document.getElementById("modalClose");

    form.addEventListener("submit", async e => {
        e.preventDefault();
        overlaySpinner.classList.remove("hidden");
        submitBtn.disabled = true;

        const formData = new FormData(form);
        try {
            const res = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/create_order/", {
                method: "POST",
                body: formData
            });
            const result = await res.json();

            let msg;
            if (result.status === "success") {
                msg = `
                <div class="modal-success">
                <h2>Zgłoszenie zostało utworzone!</h2>
                <div class="modal-price"><strong>Przewidywana cena:</strong> ${result.price}</div>
                <div class="modal-appointment"><strong>Przewidywana data realizacji:</strong> ${result.appointment_date}</div>
                <h3>Komentarz AI:</h3>
                <div class="modal-comment">${result.client_response}</div>
                </div>
                `;
                form.reset();
            } else {
                msg = `<span style="color:#dc3545;">Błąd: ${result.message}</span>`;
            }
            modalMessage.innerHTML = msg;
        } catch {
            modalMessage.innerHTML = `<span style="color:#dc3545;">Błąd połączenia z API.</span>`;
        } finally {
            overlaySpinner.classList.add("hidden");
            overlayModal.classList.remove("hidden");
        }
    });

    modalClose.addEventListener("click", () => {
        overlayModal.classList.add("hidden");
        submitBtn.disabled = false;
    });
    
    // Dodanie obsługi dotykowej dla przycisków
    if (isMobile) {
        setupTouchFeedback();
        optimizeFormForMobile();
    }
});

// Funkcja do obsługi dotykowego feedbacku
function setupTouchFeedback() {
    document.querySelectorAll('button, .nav-button, input[type="submit"]').forEach(elem => {
        elem.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        elem.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
}

// Optymalizacja formularza dla urządzeń mobilnych
function optimizeFormForMobile() {
    // Zwiększ interaktywność przycisków
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const submitBtn = document.getElementById("submitBtn");
    
    if (prevBtn && nextBtn && submitBtn) {
        // Zwiększamy obszary dotykowe
        [prevBtn, nextBtn, submitBtn].forEach(btn => {
            btn.style.minHeight = '54px';
            btn.style.fontSize = '1.1rem';
        });
    }
    
    // Dodaj obsługę automatycznego przewijania do widocznego pola
    document.querySelectorAll('input, select, textarea').forEach(elem => {
        elem.addEventListener('focus', function() {
            // Daj czas na pojawienie się klawiatury
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
    
    // Dostosuj modalne okna dla ekranów mobilnych
    const modalBox = document.querySelector('.modal-box');
    if (modalBox) {
        modalBox.style.width = '90%';
        modalBox.style.maxHeight = '80vh';
        modalBox.style.overflow = 'auto';
    }
}

document.addEventListener("DOMContentLoaded", () => {
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const prevBtn = document.getElementById("prevBtn"),
        nextBtn = document.getElementById("nextBtn"),
        submitBtn = document.getElementById("submitBtn");
  let current = 0;

  function showStep(i) {
    steps.forEach((s,idx)=>{
      s.classList.toggle("active", idx===i);
    });
    prevBtn.style.display = i===0 ? "none" : "inline-block";
    nextBtn.style.display = i===steps.length-1 ? "none" : "inline-block";
    submitBtn.style.display = i===steps.length-1 ? "inline-block" : "none";
  }

  nextBtn.addEventListener("click", ()=> {
    if (!steps[current].querySelector("input,select,textarea").checkValidity()) {
      steps[current].querySelector("input,select,textarea").reportValidity();
      return;
    }
    current++;
    showStep(current);
    
    // Przewiń do góry po zmianie kroku na urządzeniach mobilnych
    if (window.innerWidth <= 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  prevBtn.addEventListener("click", () => {
    current--;
    showStep(current);
    
    // Przewiń do góry po zmianie kroku na urządzeniach mobilnych
    if (window.innerWidth <= 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // zachowaj oryginalną logikę faktury i submission…
  showStep(current);
});