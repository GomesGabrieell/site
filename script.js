const modal = document.querySelector("#qr-modal");
const modalTitle = document.querySelector("#modal-title");
const modalPrice = document.querySelector("#modal-price");
const modalQr = document.querySelector("#modal-qr");
const closeButton = document.querySelector(".modal-close");
const messageForm = document.querySelector("#message-form");
const guestMessage = document.querySelector("#guest-message");
const giftSearch = document.querySelector("#gift-search");
const emptyState = document.querySelector("#empty-state");
const giftGrid = document.querySelector("#gift-grid");
const summaryItem = document.querySelector("#summary-item");
const summaryPrice = document.querySelector("#summary-price");
const placeholderQr = "assets/qrcodes/placeholder.svg";
const qrcodeFolder = "assets/qrcodes";
const whatsappNumbers = ["5531971131979", "553197862970"];

let selectedGift = {
  name: "",
  price: "",
};

const resetModal = () => {
  messageForm.reset();
};

const getRandomWhatsAppNumber = () => {
  const index = Math.floor(Math.random() * whatsappNumbers.length);
  return whatsappNumbers[index];
};

const formatPrice = (value) => {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return value;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue);
};

const getQrCodePath = (gift) => {
  const qrcodeName = gift.qrcode || `${gift.valor}.png`;
  return `${qrcodeFolder}/${qrcodeName}`;
};

const openGiftModal = (gift) => {
  selectedGift = {
    name: gift.nome,
    price: formatPrice(gift.valor),
  };

  modalTitle.textContent = selectedGift.name;
  modalPrice.textContent = selectedGift.price;
  summaryItem.textContent = selectedGift.name;
  summaryPrice.textContent = selectedGift.price;
  modalQr.src = getQrCodePath(gift);
  modalQr.alt = `QR Code para presentear com ${selectedGift.name}`;
  resetModal();
  modal.showModal();
};

const renderGiftCard = (gift) => {
  const card = document.createElement("article");
  card.className = "gift-card";

  const image = document.createElement("img");
  image.src = gift.imagem || "assets/gift-box.png";
  image.alt = `Presente ${gift.nome}`;

  const info = document.createElement("div");
  info.className = "gift-info";

  const title = document.createElement("h3");
  title.textContent = gift.nome;

  const price = document.createElement("p");
  price.textContent = formatPrice(gift.valor);

  const button = document.createElement("button");
  button.className = "gift-button";
  button.type = "button";
  button.textContent = "Presentear";
  button.addEventListener("click", () => openGiftModal(gift));

  info.append(title, price);
  card.append(image, info, button);

  return card;
};

const updateSearchResults = () => {
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
};

const loadGifts = async () => {
  try {
    const response = await fetch("presentes.json");

    if (!response.ok) {
      throw new Error("Nao foi possivel carregar presentes.json");
    }

    const gifts = await response.json();
    giftGrid.replaceChildren(...gifts.map(renderGiftCard));
    updateSearchResults();
  } catch (error) {
    emptyState.textContent = "Nao foi possivel carregar a lista de presentes.";
    emptyState.hidden = false;
    console.error(error);
  }
};

modalQr.addEventListener("error", () => {
  modalQr.src = placeholderQr;
});

giftSearch.addEventListener("input", updateSearchResults);

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

loadGifts();
