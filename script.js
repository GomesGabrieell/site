const modal = document.querySelector("#qr-modal");
const modalTitle = document.querySelector("#modal-title");
const modalPrice = document.querySelector("#modal-price");
const modalQr = document.querySelector("#modal-qr");
const closeButton = document.querySelector(".modal-close");
const confirmScanButton = document.querySelector("#confirm-scan");
const scanWait = document.querySelector("#scan-wait");
const messageForm = document.querySelector("#message-form");
const guestMessage = document.querySelector("#guest-message");
const giftSearch = document.querySelector("#gift-search");
const emptyState = document.querySelector("#empty-state");
const summaryItem = document.querySelector("#summary-item");
const summaryPrice = document.querySelector("#summary-price");
const placeholderQr = "assets/qrcodes/placeholder.svg";
const whatsappNumbers = ["5531971131979", "553197862970"];
const scanDelaySeconds = 10;

let selectedGift = {
  name: "",
  price: "",
};
let scanDelayTimer = null;

const showStep = (stepName) => {
  modal.querySelectorAll(".gift-step").forEach((step) => {
    step.classList.toggle("is-active", step.dataset.step === stepName);
  });
  modal.querySelectorAll(".checkout-step").forEach((step) => {
    step.classList.toggle("is-active", step.dataset.stepIndicator === stepName);
  });
};

const resetModal = () => {
  window.clearInterval(scanDelayTimer);
  showStep("qr");
  messageForm.reset();
  scanWait.hidden = true;
  confirmScanButton.hidden = true;
};

const startScanDelay = () => {
  let secondsLeft = scanDelaySeconds;

  confirmScanButton.hidden = true;
  scanWait.hidden = false;
  scanWait.textContent = `Confirmar em ${secondsLeft} segundos.`;

  scanDelayTimer = window.setInterval(() => {
    secondsLeft -= 1;

    if (secondsLeft <= 0) {
      window.clearInterval(scanDelayTimer);
      scanWait.hidden = true;
      confirmScanButton.hidden = false;
      confirmScanButton.focus();
      return;
    }

    scanWait.textContent = `Confirmar em ${secondsLeft} segundos.`;
  }, 1000);
};

const getRandomWhatsAppNumber = () => {
  const index = Math.floor(Math.random() * whatsappNumbers.length);
  return whatsappNumbers[index];
};

modalQr.addEventListener("error", () => {
  modalQr.src = placeholderQr;
});

document.querySelectorAll(".gift-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedGift = {
      name: button.dataset.name,
      price: button.dataset.price,
    };

    modalTitle.textContent = selectedGift.name;
    modalPrice.textContent = selectedGift.price;
    summaryItem.textContent = selectedGift.name;
    summaryPrice.textContent = selectedGift.price;
    modalQr.src = button.dataset.qr;
    modalQr.alt = `QR Code para presentear com ${selectedGift.name}`;
    resetModal();
    startScanDelay();
    modal.showModal();
  });
});

giftSearch.addEventListener("input", () => {
  const query = giftSearch.value.trim().toLowerCase();
  let visibleCards = 0;

  document.querySelectorAll(".gift-card").forEach((card) => {
    const name = card.querySelector("h3").textContent.toLowerCase();
    const isVisible = name.includes(query);

    card.hidden = !isVisible;

    if (isVisible) {
      visibleCards += 1;
    }
  });

  emptyState.hidden = visibleCards > 0;
});

confirmScanButton.addEventListener("click", () => {
  showStep("message");
  guestMessage.focus();
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = guestMessage.value.trim();

  if (!message) {
    guestMessage.focus();
    return;
  }

  const text = [
    "Ola, Sarah e Gabriel!",
    `Acabei de escanear o QR Code do presente: ${selectedGift.name} (${selectedGift.price}).`,
    `Mensagem: ${message}`,
  ].join("\n\n");
  const phone = getRandomWhatsAppNumber();
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  window.location.href = url;
});

closeButton.addEventListener("click", () => modal.close());

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.close();
  }
});

modal.addEventListener("close", resetModal);
