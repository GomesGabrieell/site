const modal = document.querySelector("#qr-modal");
const modalTitle = document.querySelector("#modal-title");
const modalPrice = document.querySelector("#modal-price");
const modalQr = document.querySelector("#modal-qr");
const modalGiftImage = document.querySelector("#modal-gift-image");
const closeButton = document.querySelector(".modal-close");
const giftSearch = document.querySelector("#gift-search");
const emptyState = document.querySelector("#empty-state");
const giftGrid = document.querySelector("#gift-grid");
const summaryItem = document.querySelector("#summary-item");
const summaryPrice = document.querySelector("#summary-price");
const paymentToggle = document.querySelector("#payment-toggle");
const quotaPicker = document.querySelector("#quota-picker");
const quotaCount = document.querySelector("#quota-count");
const quotaCountButton = document.querySelector("#quota-count-button");
const quotaCountButtonLabel = quotaCountButton.querySelector("span");
const quotaCountMenu = document.querySelector("#quota-count-menu");
const qrGallery = document.querySelector("#qr-gallery");
const modalHelp = document.querySelector("#modal-help");
const storeLinks = document.querySelector("#store-links");
const giftCount = document.querySelector("#gift-count");
const resultCount = document.querySelector("#result-count");
const categoryFilters = document.querySelector("#category-filters");
const giftSort = document.querySelector("#gift-sort");
const placeholderQr = "assets/qrcodes/placeholder.svg";
const placeholderGiftImage = "assets/gift-box.png";
const qrcodeFolder = "assets/qrcodes";
const quotaMinimumValue = 600;
const exampleStores = [
  { nome: "Amazon", baseUrl: "https://example.com/amazon" },
  { nome: "Mercado Livre", baseUrl: "https://example.com/mercado-livre" },
  { nome: "Magazine Luiza", baseUrl: "https://example.com/magazine-luiza" },
];

const slugify = (text) => text
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const categoryLabels = {
  casa: "Casa",
  "cama-mesa-banho": "Cama, mesa e banho",
  cozinha: "Cozinha",
  lavanderia: "Lavanderia",
  noivos: "Noivos",
  geral: "Geral",
};

const categoryKeywords = {
  "cama-mesa-banho": [
    "cama",
    "toalha",
    "toalhas",
    "banho",
    "lencol",
    "travesseiro",
    "edredom",
    "cobertor",
    "mesa-posta",
    "faqueiro",
    "prato",
    "talher",
    "jogo-americano",
  ],
  cozinha: [
    "air-fryer",
    "liquidificador",
    "panela",
    "panelas",
    "cafeteira",
    "micro-ondas",
    "microondas",
    "cozinha",
    "forno",
    "batedeira",
    "mixer",
    "cooktop",
    "geladeira",
  ],
  lavanderia: [
    "lavanderia",
    "lavar",
    "lava",
    "ferro",
    "passar",
    "aspirador",
    "varal",
    "tanque",
    "cesto",
  ],
  noivos: [
    "lua-de-mel",
    "lua",
    "mel",
    "jantar-especial",
    "jantar",
    "viagem",
    "passeio",
    "experiencia",
    "cotas",
    "cota",
    "noivos",
  ],
  casa: [
    "casa",
    "decoracao",
    "decor",
    "sala",
    "quarto",
    "tapete",
    "abajur",
    "luminaria",
    "organizadora",
    "organizador",
  ],
};

const getGiftCategory = (gift) => {
  const nameSlug = slugify(gift.nome || "");
  const category = Object.entries(categoryKeywords).find(([, keywords]) => (
    keywords.some((keyword) => nameSlug.includes(keyword))
  ));

  return category?.[0] || "geral";
};

const getGiftCategoryLabel = (gift) => categoryLabels[getGiftCategory(gift)] || categoryLabels.geral;

const getExampleLinks = (giftName) => {
  const slug = slugify(giftName);

  return exampleStores.map((store) => ({
    nome: store.nome,
    url: `${store.baseUrl}/${slug}`,
  }));
};

const hasFilledLinks = (gift) => {
  const configuredLinks = gift.links || gift.linkCompra || gift.linkPresente || gift.link || gift.url || [];
  const linkList = Array.isArray(configuredLinks) ? configuredLinks : [configuredLinks];

  return linkList.some((link) => {
    if (typeof link === "string") {
      return link.trim();
    }

    return (link?.url || link?.link || link?.href || "").trim();
  });
};

const withExampleLinks = (gift) => ({
  ...gift,
  links: hasFilledLinks(gift) ? gift.links : getExampleLinks(gift.nome),
});

let selectedGift = {
  name: "",
  price: "",
  raw: null,
};

let selectedPayment = {
  mode: "full",
  quotas: 1,
  description: "",
};

let isLoadingGifts = false;
let allGifts = [];
let selectedCategory = "all";

const resetModal = () => {
  selectedPayment = {
    mode: "full",
    quotas: 1,
    description: "",
  };
  closeQuotaDropdown();
  quotaPicker.hidden = true;
  document.querySelectorAll(".payment-option").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.paymentMode === "full");
  });
};

const closeQuotaDropdown = () => {
  quotaCount.classList.remove("is-open");
  quotaCountButton.setAttribute("aria-expanded", "false");
};

const toggleQuotaDropdown = () => {
  const isOpen = quotaCount.classList.toggle("is-open");
  quotaCountButton.setAttribute("aria-expanded", String(isOpen));
};

const setQuotaValue = (value) => {
  const option = quotaCountMenu.querySelector(`[data-value="${value}"]`);

  if (!option) {
    return;
  }

  quotaCount.dataset.value = value;
  quotaCountButtonLabel.textContent = option.textContent;
  quotaCountMenu.querySelectorAll(".quota-dropdown-option").forEach((button) => {
    const isSelected = button === option;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });
};

const getMaxQuotasByValue = (value) => {
  const giftValue = Number(value);

  if (giftValue >= 1000) {
    return 10;
  }

  if (giftValue >= 900) {
    return 4;
  }

  if (giftValue >= 800) {
    return 3;
  }

  if (giftValue >= 700) {
    return 2;
  }

  if (giftValue >= quotaMinimumValue) {
    return 1;
  }

  return 0;
};

const hasConfiguredQuotas = (gift) => Array.isArray(gift.cotas) && gift.cotas.length > 0;

const canUseQuotas = (gift) => hasConfiguredQuotas(gift) || getMaxQuotasByValue(gift.valor) > 0;

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

const formatQrAmount = (value) => {
  const cents = Math.round(Number(value) * 100);
  return String(cents).padStart(3, "0");
};

const getQrCodePath = (gift) => {
  const qrcodeName = gift.qrcode || gift.qrcodes?.avista || gift.qrcodes?.full || `${gift.valor}.png`;
  return `${qrcodeFolder}/${qrcodeName}`;
};

const getQuotaTotal = (gift) => {
  if (hasConfiguredQuotas(gift)) {
    return gift.cotas.length;
  }

  const maxQuotas = getMaxQuotasByValue(gift.valor);

  const configuredTotal = Number(gift.totalCotas || gift.cotasTotal || gift.quantidadeCotas);

  if (Number.isFinite(configuredTotal) && configuredTotal > 1) {
    return Math.min(Math.floor(configuredTotal), maxQuotas);
  }

  const quotaValue = Number(gift.valorCota);

  if (Number.isFinite(quotaValue) && quotaValue > 0) {
    return Math.min(Math.ceil(Number(gift.valor) / quotaValue), maxQuotas);
  }

  return maxQuotas;
};

const getQuotaAmount = (gift, quotas) => {
  const configuredQuota = Array.isArray(gift.cotas) ? gift.cotas[quotas - 1] : null;
  const configuredAmount = configuredQuota && typeof configuredQuota === "object"
    ? Number(configuredQuota.valor || configuredQuota.total)
    : Number(configuredQuota);

  if (Number.isFinite(configuredAmount) && configuredAmount > 0) {
    return configuredAmount;
  }

  const quotaValue = Number(gift.valorCota);

  if (Number.isFinite(quotaValue) && quotaValue > 0) {
    return quotaValue * quotas;
  }

  if (Number(gift.valor) >= 1000) {
    return quotas * 100;
  }

  return 300 + ((quotas - 1) * 100);
};

const getQuotaQrCodePath = (gift, quotas, amount) => {
  const amountKey = formatQrAmount(amount);
  const explicitQuota = Array.isArray(gift.cotas) ? gift.cotas[quotas - 1] : null;
  const explicitQrCode = (explicitQuota && typeof explicitQuota === "object" ? explicitQuota.qrcode : null)
    || gift.qrcodes?.cotas?.[quotas]
    || gift.qrcodes?.quotas?.[quotas]
    || gift.qrcodes?.valores?.[amountKey]
    || gift.qrcodes?.amounts?.[amountKey];

  if (explicitQrCode) {
    return `${qrcodeFolder}/${explicitQrCode}`;
  }

  return `${qrcodeFolder}/${formatQrAmount(amount)}.png`;
};

const getGiftImagePath = (gift) => gift.imagem || placeholderGiftImage;

const normalizeStoreLink = (link) => {
  if (!link) {
    return "";
  }

  return /^https?:\/\//i.test(link) ? link : `https://${link}`;
};

const normalizeGiftLink = (link, index) => {
  const rawUrl = typeof link === "string"
    ? link
    : link?.url || link?.link || link?.href || "";

  if (!rawUrl) {
    return null;
  }

  return {
    label: typeof link === "string" ? `Opcao ${index + 1}` : link.nome || link.label || link.loja || `Opcao ${index + 1}`,
    url: normalizeStoreLink(rawUrl),
  };
};

const getGiftStoreLinks = (gift) => {
  const configuredLinks = gift.links || gift.linkCompra || gift.linkPresente || gift.link || gift.url || [];
  const linkList = Array.isArray(configuredLinks) ? configuredLinks : [configuredLinks];

  return linkList
    .map(normalizeGiftLink)
    .filter(Boolean);
};

const updateStoreLink = (gift) => {
  const links = getGiftStoreLinks(gift);

  if (links.length === 0) {
    const emptyNote = document.createElement("p");
    emptyNote.className = "store-empty";
    emptyNote.textContent = "Cadastre um link em presentes.json para liberar essa opção.";
    storeLinks.replaceChildren(emptyNote);
    return;
  }

  storeLinks.replaceChildren(...links.map(({ label, url }) => {
    const link = document.createElement("a");
    link.className = "store-link";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;

    return link;
  }));
};

const createQrCard = ({ label, price, src, alt }) => {
  const card = document.createElement("div");
  card.className = "qr-card";

  const title = document.createElement("span");
  title.textContent = label;

  const frame = document.createElement("div");
  frame.className = "qr-frame";

  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.addEventListener("error", () => {
    image.src = placeholderQr;
  }, { once: true });

  const value = document.createElement("strong");
  value.textContent = price;

  frame.append(image);
  card.append(title, frame, value);

  return card;
};

const updatePaymentView = () => {
  if (!selectedGift.raw) {
    return;
  }

  const gift = selectedGift.raw;
  const isQuotaMode = selectedPayment.mode === "quota" && canUseQuotas(gift);
  const isLinksMode = selectedPayment.mode === "links";
  const quotas = isQuotaMode
    ? Math.min(Number(quotaCount.dataset.value || "1"), getQuotaTotal(gift))
    : 1;

  selectedPayment.quotas = quotas;
  quotaPicker.hidden = !isQuotaMode;
  storeLinks.hidden = !isLinksMode;
  qrGallery.hidden = isLinksMode;

  document.querySelectorAll(".payment-option").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.paymentMode === selectedPayment.mode);
  });

  if (isLinksMode) {
    selectedPayment.description = "compra por link";
    summaryPrice.textContent = "Link da loja";
    modalHelp.textContent = "Abra uma das opcoes de loja para comprar e presentear os noivos.";
    qrGallery.replaceChildren();
    return;
  }

  if (!isQuotaMode) {
    selectedPayment.description = `valor integral de ${selectedGift.price}`;
    summaryPrice.textContent = selectedGift.price;
    modalHelp.textContent = "Escaneie o QR Code para fazer o Pix integral.";
    qrGallery.replaceChildren(createQrCard({
      label: "Pagamento unico",
      price: selectedGift.price,
      src: getQrCodePath(gift),
      alt: `QR Code integral para presentear com ${selectedGift.name}`,
    }));
    return;
  }

  const quotaAmount = getQuotaAmount(gift, quotas);
  const quotaPrice = formatPrice(quotaAmount);
  const quotaLabel = quotas === 1 ? "1 parcela" : `${quotas} parcelas`;

  selectedPayment.description = `${quotaLabel} no valor de ${quotaPrice}`;
  summaryPrice.textContent = quotaPrice;
  modalHelp.textContent = "Escaneie o QR Code correspondente ao valor escolhido.";
  qrGallery.replaceChildren(createQrCard({
    label: quotaLabel,
    price: quotaPrice,
    src: getQuotaQrCodePath(gift, quotas, quotaAmount),
    alt: `QR Code de ${quotaPrice} para ${selectedGift.name}`,
  }));
};

const updateQuotaOptions = (gift) => {
  const quotaPaymentOption = document.querySelector('.payment-option[data-payment-mode="quota"]');
  const quotasEnabled = canUseQuotas(gift);

  quotaPaymentOption.hidden = !quotasEnabled;
  quotaPicker.hidden = true;

  if (!quotasEnabled) {
    quotaCountMenu.replaceChildren();
    quotaCount.dataset.value = "1";
    quotaCountButtonLabel.textContent = "1 parcela";
    return;
  }

  const quotaTotal = getQuotaTotal(gift);
  const options = Array.from({ length: quotaTotal }, (_, index) => {
    const quotas = index + 1;
    const option = document.createElement("button");
    const quotaLabel = quotas === 1 ? "1 parcela" : `${quotas} parcelas`;

    option.type = "button";
    option.className = "quota-dropdown-option";
    option.dataset.value = String(quotas);
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.value = String(quotas);
    option.textContent = `${quotaLabel} - ${formatPrice(getQuotaAmount(gift, quotas))}`;

    return option;
  });

  quotaCountMenu.replaceChildren(...options);
  setQuotaValue("1");
  closeQuotaDropdown();
};

const openGiftModal = (gift) => {
  selectedGift = {
    name: gift.nome,
    price: formatPrice(gift.valor),
    raw: gift,
  };

  modalTitle.textContent = selectedGift.name;
  modalPrice.textContent = selectedGift.price;
  summaryItem.textContent = selectedGift.name;
  summaryPrice.textContent = selectedGift.price;
  modalGiftImage.src = getGiftImagePath(gift);
  modalGiftImage.alt = `Foto do presente ${selectedGift.name}`;
  updateStoreLink(gift);
  updateQuotaOptions(gift);
  resetModal();
  updatePaymentView();
  modal.showModal();
};

const renderGiftCard = (gift) => {
  const card = document.createElement("article");
  card.className = "gift-card";
  card.dataset.badge = canUseQuotas(gift) ? "Pix/Parcelas" : "Pix/Link";

  const image = document.createElement("img");
  image.src = getGiftImagePath(gift);
  image.alt = `Presente ${gift.nome}`;
  image.addEventListener("error", () => {
    image.src = placeholderGiftImage;
  }, { once: true });

  const info = document.createElement("div");
  info.className = "gift-info";

  const title = document.createElement("h3");
  title.textContent = gift.nome;

  const priceRow = document.createElement("div");
  priceRow.className = "gift-price-row";

  const price = document.createElement("p");
  price.textContent = formatPrice(gift.valor);

  const chip = document.createElement("span");
  chip.className = "gift-chip";
  chip.textContent = getGiftCategoryLabel(gift);

  const meta = document.createElement("span");
  meta.className = "gift-meta";
  meta.textContent = canUseQuotas(gift)
    ? "Escolha o valor integral ou uma parcela."
    : "Pague por Pix ou abra o link da loja.";

  const button = document.createElement("button");
  button.className = "gift-button";
  button.type = "button";
  button.textContent = "Presentear";
  button.addEventListener("click", () => openGiftModal(gift));

  priceRow.append(price, chip);
  info.append(title, priceRow, meta);
  card.append(image, info, button);

  return card;
};

const matchesCategoryFilter = (gift) => selectedCategory === "all" || getGiftCategory(gift) === selectedCategory;

const sortGifts = (gifts) => {
  const sorted = [...gifts];

  if (giftSort.value === "price-asc") {
    return sorted.sort((first, second) => Number(first.valor) - Number(second.valor));
  }

  if (giftSort.value === "price-desc") {
    return sorted.sort((first, second) => Number(second.valor) - Number(first.valor));
  }

  if (giftSort.value === "name-asc") {
    return sorted.sort((first, second) => first.nome.localeCompare(second.nome, "pt-BR"));
  }

  return sorted.sort((first, second) => {
    const firstCanQuota = canUseQuotas(first) ? 0 : 1;
    const secondCanQuota = canUseQuotas(second) ? 0 : 1;

    if (firstCanQuota !== secondCanQuota) {
      return firstCanQuota - secondCanQuota;
    }

    return Number(second.valor) - Number(first.valor);
  });
};

const updateGiftCount = (visibleCount) => {
  const total = allGifts.length;
  const totalLabel = total === 1 ? "1 presente" : `${total} presentes`;
  const visibleLabel = visibleCount === 1 ? "1 encontrado" : `${visibleCount} encontrados`;

  giftCount.textContent = totalLabel;
  resultCount.textContent = `${visibleLabel} de ${totalLabel}`;
};

const renderGiftList = () => {
  const query = giftSearch.value.trim().toLowerCase();
  const visibleGifts = sortGifts(allGifts.filter((gift) => (
    gift.nome.toLowerCase().includes(query) && matchesCategoryFilter(gift)
  )));

  giftGrid.replaceChildren(...visibleGifts.map(renderGiftCard));
  emptyState.hidden = visibleGifts.length > 0;
  updateGiftCount(visibleGifts.length);
};

const getJsonLoadErrorMessage = () => {
  if (window.location.protocol === "file:") {
    return "O site foi aberto como arquivo. Use o abrir-site.bat e acesse http://localhost:8000 para carregar presentes.json.";
  }

  return "Nao foi possivel carregar presentes.json. Confira se o servidor local esta aberto na pasta do site e se o JSON esta valido.";
};

const loadGifts = async () => {
  if (isLoadingGifts) {
    return;
  }

  isLoadingGifts = true;
  let gifts = [];

  try {
    const response = await fetch(`presentes.json?v=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel carregar presentes.json");
    }

    gifts = await response.json();
  } catch (error) {
    emptyState.textContent = getJsonLoadErrorMessage();
    emptyState.hidden = false;
    console.error(error);
    isLoadingGifts = false;
    return;
  }

  try {
    allGifts = gifts.map(withExampleLinks);
    renderGiftList();
  } catch (error) {
    emptyState.textContent = "Nao foi possivel carregar a lista de presentes.";
    emptyState.hidden = false;
    console.error(error);
  } finally {
    isLoadingGifts = false;
  }
};

modalQr.addEventListener("error", () => {
  modalQr.src = placeholderQr;
});

modalGiftImage.addEventListener("error", () => {
  modalGiftImage.src = placeholderGiftImage;
});

giftSearch.addEventListener("input", renderGiftList);

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-button");

  if (!button) {
    return;
  }

  selectedCategory = button.dataset.category;
  document.querySelectorAll(".filter-button").forEach((filterButton) => {
    filterButton.classList.toggle("is-active", filterButton === button);
  });
  renderGiftList();
});

giftSort.addEventListener("change", renderGiftList);

paymentToggle.addEventListener("click", (event) => {
  const button = event.target.closest(".payment-option");

  if (!button) {
    return;
  }

  selectedPayment.mode = button.dataset.paymentMode;
  updatePaymentView();
});

quotaCountButton.addEventListener("click", toggleQuotaDropdown);

quotaCountMenu.addEventListener("click", (event) => {
  const option = event.target.closest(".quota-dropdown-option");

  if (!option) {
    return;
  }

  setQuotaValue(option.dataset.value);
  closeQuotaDropdown();
  updatePaymentView();
});

quotaCount.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeQuotaDropdown();
    quotaCountButton.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!quotaCount.contains(event.target)) {
    closeQuotaDropdown();
  }
});

closeButton.addEventListener("click", (event) => {
  event.stopPropagation();
  modal.close();
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.close();
  }
});

modal.addEventListener("close", resetModal);

loadGifts();

window.addEventListener("focus", () => {
  if (!modal.open) {
    loadGifts();
  }
});
