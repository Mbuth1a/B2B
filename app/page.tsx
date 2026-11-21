"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Compass,
  Crown,
  Download,
  FileText,
  Heart,
  Landmark,
  LockKeyhole,
  MessageCircle,
  PackageSearch,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Category = "Gold" | "Silver" | "Timber Logs" | "Precious Metals";
type SellerStatus = "active" | "cancelled" | "paused";

type Seller = {
  id: number;
  name: string;
  category: Category;
  status: SellerStatus;
  match: number;
  location: string;
  country: string;
  image: string;
  description: string;
  capacity: string;
  purity: string;
  verified: boolean;
  tags: string[];
};

type ChatMessage = {
  sender: "buyer" | "seller";
  text: string;
  sentAt: string;
};

type RfqStatus = "Draft" | "Published" | "Quotes received" | "Evaluation" | "Awarded" | "Closed" | "Cancelled";

type RfqQuote = {
  sellerId: number;
  sellerName: string;
  unitPrice: string;
  totalPrice: string;
  leadTime: string;
  incoterm: string;
  validUntil: string;
  status: "Submitted" | "Shortlisted" | "Declined";
};

type ProcurementRfq = {
  id: string;
  title: string;
  commodity: Category;
  specification: string;
  quantity: string;
  unit: string;
  targetDelivery: string;
  deliveryLocation: string;
  incoterm: string;
  closingDate: string;
  status: RfqStatus;
  budget: string;
  notes: string;
  supplierIds: number[];
  quotes: RfqQuote[];
  createdAt: string;
};

type FinanceInstrument = "Letter of credit" | "Escrow" | "Trade loan" | "Bank guarantee";
type FinanceStatus = "Draft" | "Pending documents" | "Under review" | "Pending acceptance" | "In custody" | "Active" | "Settled" | "Declined";

type FinanceTransaction = {
  id: string;
  instrument: FinanceInstrument;
  counterparty: string;
  counterpartySellerId?: number;
  amount: number;
  currency: "USD" | "EUR" | "GBP";
  status: FinanceStatus;
  maturityDate: string;
  reference: string;
  purpose: string;
  createdAt: string;
  documents: string[];
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  interests?: Category[];
  role: "buyer" | "seller" | "admin";
};

type OfferComment = {
  id: string;
  author: string;
  role: "buyer" | "seller";
  text: string;
  liked: boolean;
  createdAt: string;
};

type SellerOffer = {
  id: string;
  sellerId: number;
  ownerId?: string;
  ownerEmail?: string;
  sellerName: string;
  category: Category;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  country: string;
  price: string;
  comments: OfferComment[];
  image?: string;
};

const sellers: Seller[] = [
  {
    id: 1,
    name: "Aurum Refinery Group",
    category: "Gold",
    status: "active",
    match: 98,
    location: "Dubai",
    country: "United Arab Emirates",
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1000&q=85",
    description: "LBMA-certified refinery supplying investment-grade gold bars and dore to institutional buyers worldwide.",
    capacity: "500 kg / month",
    purity: "99.99%",
    verified: true,
    tags: ["LBMA", "Bullion", "Export ready"],
  },
  {
    id: 2,
    name: "Nordic Silver Works",
    category: "Silver",
    status: "active",
    match: 94,
    location: "Stockholm",
    country: "Sweden",
    image: "https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?auto=format&fit=crop&w=1000&q=85",
    description: "Responsible silver producer offering refined bullion, grains and custom industrial supply contracts.",
    capacity: "12 tonnes / month",
    purity: "99.95%",
    verified: true,
    tags: ["Refined", "Industrial", "Responsible"],
  },
  {
    id: 3,
    name: "Cedar Valley Timber",
    category: "Timber Logs",
    status: "active",
    match: 91,
    location: "Vancouver",
    country: "Canada",
    image: "https://images.unsplash.com/photo-1515446134809-993c501ca304?auto=format&fit=crop&w=1000&q=85",
    description: "FSC-certified Douglas fir and cedar logs with sustainable harvesting and port-to-port logistics.",
    capacity: "40,000 m3 / quarter",
    purity: "FSC certified",
    verified: true,
    tags: ["FSC", "Cedar", "Export logs"],
  },
  {
    id: 4,
    name: "Atlas Platinum Exchange",
    category: "Precious Metals",
    status: "active",
    match: 89,
    location: "Johannesburg",
    country: "South Africa",
    image: "https://images.unsplash.com/photo-1565373679107-44d4b2f3a6e4?auto=format&fit=crop&w=1000&q=85",
    description: "Platinum and palladium sourcing with auditable provenance, secure custody and wholesale settlement.",
    capacity: "1,800 oz / month",
    purity: "99.95%",
    verified: true,
    tags: ["Platinum", "Palladium", "Vaulted"],
  },
  {
    id: 5,
    name: "Kilimanjaro Metals",
    category: "Gold",
    status: "cancelled",
    match: 87,
    location: "Dar es Salaam",
    country: "Tanzania",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1000&q=85",
    description: "Mining and export partner for responsibly sourced gold concentrate.",
    capacity: "200 kg / month",
    purity: "92%+",
    verified: false,
    tags: ["Mining", "Concentrate"],
  },
];

const categoryFilters: ("All commodities" | Category)[] = [
  "All commodities",
  "Gold",
  "Silver",
  "Timber Logs",
  "Precious Metals",
];

const navItems = [
  { label: "Discover", icon: Compass },
  { label: "Matches", icon: Heart },
  { label: "Messages", icon: MessageCircle },
];

const emptyRfqForm = {
  title: "",
  commodity: "Gold" as Category,
  specification: "",
  quantity: "",
  unit: "kg",
  targetDelivery: "",
  deliveryLocation: "",
  incoterm: "CIF",
  closingDate: "",
  budget: "",
  notes: "",
  supplierIds: [] as number[],
};

const initialFinanceTransactions: FinanceTransaction[] = [
  { id: "LC-8721", instrument: "Letter of credit", counterparty: "Aurum Refinery Group", counterpartySellerId: 1, amount: 180000, currency: "USD", status: "Pending acceptance", maturityDate: "2026-11-14", reference: "RFQ-1048 / Gold bars", purpose: "Funding for investment-grade gold bar shipment.", createdAt: "2026-11-03T09:00:00.000Z", documents: ["Proforma invoice", "Purchase order", "Insurance certificate"] },
  { id: "ESC-4418", instrument: "Escrow", counterparty: "Nordic Silver Works", counterpartySellerId: 2, amount: 320000, currency: "USD", status: "In custody", maturityDate: "2026-11-21", reference: "RFQ-1049 / Silver allocation", purpose: "Buyer funds held until assay and delivery acceptance.", createdAt: "2026-11-01T14:20:00.000Z", documents: ["Assay instructions", "Commercial invoice", "Bill of lading"] },
  { id: "LC-8699", instrument: "Letter of credit", counterparty: "Cedar Valley Timber", counterpartySellerId: 3, amount: 140000, currency: "USD", status: "Settled", maturityDate: "2026-10-28", reference: "RFQ-1042 / Timber logs", purpose: "Port settlement for FSC-certified timber shipment.", createdAt: "2026-10-15T11:30:00.000Z", documents: ["FSC certificate", "Packing list", "Certificate of origin"] },
  { id: "TL-1052", instrument: "Trade loan", counterparty: "Atlas Platinum Exchange", counterpartySellerId: 4, amount: 240000, currency: "USD", status: "Under review", maturityDate: "2026-12-05", reference: "Spot platinum procurement", purpose: "Short-term working capital for precious metals inventory.", createdAt: "2026-11-05T16:45:00.000Z", documents: ["Company accounts", "Purchase order"] },
];

const initialSellerOffers: SellerOffer[] = [
  {
    id: "offer-1",
    sellerId: 1,
    sellerName: "Aurum Refinery Group",
    category: "Gold",
    title: "Investment-grade gold bars",
    description: "LBMA Good Delivery bars available for insured vault delivery.",
    quantity: "500",
    unit: "kg",
    country: "United Arab Emirates",
    price: "Indicative $92,000/kg",
    comments: [
      { id: "comment-1", author: "Maya Ortiz", role: "buyer", text: "Can you supply 100 kg in December?", liked: true, createdAt: "2026-11-05T10:00:00.000Z" },
    ],
  },
  {
    id: "offer-2",
    sellerId: 2,
    sellerName: "Nordic Silver Works",
    category: "Silver",
    title: "Refined silver allocation",
    description: "Responsibly refined silver grains for industrial and institutional buyers.",
    quantity: "12",
    unit: "tonnes",
    country: "Sweden",
    price: "Subject to assay",
    comments: [],
  },
];

export default function HomePage() {
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [utilityPanel, setUtilityPanel] = useState<"settings" | "notifications" | "profile" | null>(null);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authCountry, setAuthCountry] = useState("");
  const [authAccountType, setAuthAccountType] = useState<"buyer" | "seller">("buyer");
  const [authCategory, setAuthCategory] = useState<Category>("Gold");
  const [authInterests, setAuthInterests] = useState<Category[]>(["Gold"]);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeNav, setActiveNav] = useState("Discover");
  const [portalRole, setPortalRole] = useState<"buyer" | "seller">("buyer");
  const [discoverTestRole, setDiscoverTestRole] = useState<"buyer" | "seller">("buyer");
  const [sellerPreviewMode, setSellerPreviewMode] = useState<"own" | "other">("own");
  const [otherSellerIndex, setOtherSellerIndex] = useState(0);
  const [sellerPortalId, setSellerPortalId] = useState(1);
  const [managedSellerStatuses, setManagedSellerStatuses] = useState<Record<number, SellerStatus>>(
    Object.fromEntries(sellers.map((seller) => [seller.id, seller.status]))
  );
  const [category, setCategory] = useState<(typeof categoryFilters)[number]>("All commodities");
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [sellerSubscriptionActive, setSellerSubscriptionActive] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [cancelledIds, setCancelledIds] = useState<number[]>([]);
  const [connectedIds, setConnectedIds] = useState<number[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Welcome back, Maya. I can shortlist verified commodity suppliers for your purchase requirements." },
    { from: "bot", text: "Are you sourcing bullion, industrial metals or timber logs?" },
  ]);
  const [threadMessages, setThreadMessages] = useState<Record<number, ChatMessage[]>>({});
  const [sellerOffers, setSellerOffers] = useState<SellerOffer[]>(initialSellerOffers);
  const [offerCommentDraft, setOfferCommentDraft] = useState<Record<string, string>>({});
  const [showInboxUpgrade, setShowInboxUpgrade] = useState(false);
  const [showSellerPostModal, setShowSellerPostModal] = useState(false);
  const [sellerPostTitle, setSellerPostTitle] = useState("");
  const [sellerPostDescription, setSellerPostDescription] = useState("");
  const [sellerPostQuantity, setSellerPostQuantity] = useState("");
  const [sellerPostUnit, setSellerPostUnit] = useState("kg");
  const [sellerPostCategory, setSellerPostCategory] = useState<Category>("Gold");
  const [sellerPostPrice, setSellerPostPrice] = useState("");
  const [sellerPostCountry, setSellerPostCountry] = useState("");
  const [sellerPostImage, setSellerPostImage] = useState("");
  const [sellerDailyPostCount, setSellerDailyPostCount] = useState(0);
  const [activeSellerId, setActiveSellerId] = useState<number | null>(1);
  const [messageDraft, setMessageDraft] = useState("");
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [rfqs, setRfqs] = useState<ProcurementRfq[]>([
    {
      id: "RFQ-1048",
      title: "Investment-grade gold bars",
      commodity: "Gold",
      specification: "LBMA Good Delivery, 99.99% purity",
      quantity: "100",
      unit: "kg",
      targetDelivery: "2026-12-15",
      deliveryLocation: "Dubai Multi Commodities Centre",
      incoterm: "CIF",
      closingDate: "2026-11-18",
      status: "Quotes received",
      budget: "$9,200,000",
      notes: "Require independent assay and insured vault delivery.",
      supplierIds: [1, 5],
      quotes: [
        { sellerId: 1, sellerName: "Aurum Refinery Group", unitPrice: "$92,000/kg", totalPrice: "$9,200,000", leadTime: "21 days", incoterm: "CIF", validUntil: "2026-11-30", status: "Submitted" },
      ],
      createdAt: "2026-11-04T09:30:00.000Z",
    },
    {
      id: "RFQ-1042",
      title: "FSC Douglas fir logs",
      commodity: "Timber Logs",
      specification: "Douglas fir, minimum 40 cm diameter",
      quantity: "12000",
      unit: "m3",
      targetDelivery: "2027-01-20",
      deliveryLocation: "Port of Rotterdam",
      incoterm: "FOB",
      closingDate: "2026-11-25",
      status: "Draft",
      budget: "$2,400,000",
      notes: "FSC chain-of-custody documentation is mandatory.",
      supplierIds: [3],
      quotes: [],
      createdAt: "2026-10-29T14:10:00.000Z",
    },
  ]);
  const [procurementSearch, setProcurementSearch] = useState("");
  const [procurementStatus, setProcurementStatus] = useState<"All" | RfqStatus>("All");
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [editingRfqId, setEditingRfqId] = useState<string | null>(null);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [complianceChecks, setComplianceChecks] = useState<Record<string, boolean>>({
    kyb: true,
    beneficialOwners: true,
    sanctions: false,
    origin: false,
    insurance: false,
  });
  const [rfqForm, setRfqForm] = useState(emptyRfqForm);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(initialFinanceTransactions);
  const [financeSearch, setFinanceSearch] = useState("");
  const [financeFilter, setFinanceFilter] = useState<"All" | "Active" | "Pending" | "Settled">("All");
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [selectedFinanceId, setSelectedFinanceId] = useState<string | null>(null);
  const [financeForm, setFinanceForm] = useState({
    instrument: "Letter of credit" as FinanceInstrument,
    counterparty: "",
    counterpartySellerId: "",
    amount: "",
    currency: "USD" as FinanceTransaction["currency"],
    maturityDate: "",
    reference: "",
    purpose: "",
  });

  useEffect(() => {
    async function initializeApp() {
      localStorage.removeItem("linkly_session");
      localStorage.removeItem("linkly_buyer_accounts");
      localStorage.removeItem("linkly_seller_accounts");
      setSubscriptionActive(localStorage.getItem("linkly_subscription") === "active");

      const savedCancelled = localStorage.getItem("linkly_cancelled_suggestions");
      const savedConnected = localStorage.getItem("linkly_connections");
      const savedThreads = localStorage.getItem("linkly_conversations");
      const savedRfqs = localStorage.getItem("linkly_rfqs");
      const savedFinance = localStorage.getItem("linkly_finance");
      const savedOffers = localStorage.getItem("linkly_seller_offers");
      if (savedCancelled) setCancelledIds(JSON.parse(savedCancelled));
      if (savedConnected) setConnectedIds(JSON.parse(savedConnected));
      if (savedThreads) setThreadMessages(JSON.parse(savedThreads));
      if (savedRfqs) setRfqs(JSON.parse(savedRfqs));
      if (savedFinance) setFinanceTransactions(JSON.parse(savedFinance));
      if (savedOffers) setSellerOffers(JSON.parse(savedOffers));

      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (response.ok) {
          const result = await response.json() as { user: AuthUser };
          const user = result.user;
          setAuthUser(user);
          setProfileName(user.name);
          setProfileEmail(user.email);
          setPortalRole(user.role === "admin" || user.role === "seller" ? "seller" : "buyer");
          setDiscoverTestRole(user.role === "seller" || user.role === "admin" ? "seller" : "buyer");
          setActiveNav(user.role === "admin" ? "Seller dashboard" : user.role === "seller" ? "Seller dashboard" : "Discover");
          const emailSubscriptionKey = `linkly_seller_subscription:${user.email.toLowerCase()}`;
          const idSubscriptionKey = `linkly_seller_subscription:${user.id}`;
          if (localStorage.getItem(emailSubscriptionKey) === "active") {
            localStorage.setItem(idSubscriptionKey, "active");
            localStorage.removeItem(emailSubscriptionKey);
          }
          setSellerSubscriptionActive(localStorage.getItem(idSubscriptionKey) === "active");
          const daily = JSON.parse(localStorage.getItem("linkly_seller_daily_posts") ?? '{"date":"","counts":{}}');
          const today = new Date().toISOString().slice(0, 10);
          setSellerDailyPostCount(daily.date === today ? Number(daily.counts?.[user.id] ?? daily.counts?.[user.email.toLowerCase()] ?? 0) : 0);
        } else if (response.status !== 401) {
          const result = await response.json() as { error?: string };
          setAuthError(result.error || "Unable to initialize secure sign-in.");
        }
      } catch {
        setAuthError("Unable to reach the secure sign-in service.");
      } finally {
        setAuthReady(true);
      }
    }
    void initializeApp();
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") setUtilityPanel(null);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const eligibleSellers = useMemo(() => {
    return sellers.filter((seller) => {
      if (seller.status !== "active") return false;
      if (cancelledIds.includes(seller.id)) return false;
      if (category !== "All commodities" && seller.category !== category) return false;
      return true;
    });
  }, [cancelledIds, category]);

  const currentSeller = eligibleSellers[0];

  const searchResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) return [];
    const supplierMatches = sellers.filter((seller) =>
      seller.status === "active" &&
      [seller.name, seller.category, seller.location, seller.country, ...seller.tags]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
    const rfqMatches = rfqs.filter((rfq) => `${rfq.id} ${rfq.title} ${rfq.commodity}`.toLowerCase().includes(query))
      .map((rfq) => ({ id: rfq.id, name: rfq.title, detail: `${rfq.id} · ${rfq.status}`, kind: "RFQ" }));
    const supplierResults = supplierMatches.map((seller) => ({
      id: `supplier-${seller.id}`,
      name: seller.name,
      detail: `${seller.category} · ${seller.location}`,
      kind: "Supplier",
      sellerId: seller.id,
    }));
    return [...supplierResults, ...rfqMatches].slice(0, 6);
  }, [globalSearch, rfqs]);

    function openUtilityPanel(panel: "settings" | "notifications" | "profile") {
      if (panel === "profile" && authUser) {
        setProfileName(authUser.name);
        setProfileEmail(authUser.email);
        setProfileError("");
        setProfileNotice("");
      }
      setUtilityPanel((current) => current === panel ? null : panel);
    }

    async function saveProfile(event: FormEvent) {
      event.preventDefault();
      if (!authUser || !profileName.trim() || !profileEmail.trim()) {
        setProfileError("Name and email are required.");
        return;
      }
      setProfileError("");
      setProfileNotice("");
      try {
        const response = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: profileName.trim(), email: profileEmail.trim() }),
        });
        const result = await response.json() as { user?: AuthUser; error?: string; emailChangePending?: boolean };
        if (!response.ok || !result.user) {
          setProfileError(result.error || "Unable to update your profile.");
          return;
        }
        const updated = result.user;
        setAuthUser(updated);
        setProfileName(updated.name);
        setProfileEmail(updated.email);
        if (updated.role === "seller") {
          const offers = JSON.parse(localStorage.getItem("linkly_seller_offers") ?? "[]") as SellerOffer[];
          const updatedOffers = offers.map((offer) =>
            offer.ownerId === updated.id || (!offer.ownerId && offer.ownerEmail?.toLowerCase() === authUser.email.toLowerCase())
              ? { ...offer, ownerId: updated.id, ownerEmail: updated.email, sellerName: updated.name }
              : offer
          );
          localStorage.setItem("linkly_seller_offers", JSON.stringify(updatedOffers));
          setSellerOffers(updatedOffers);
        }
        setProfileNotice(result.emailChangePending
          ? "We sent a confirmation link to the new email. Your sign-in email changes after confirmation."
          : "Profile updated.");
      } catch {
        setProfileError("Unable to reach the secure profile service.");
      }
    }

  function persistSellerOffers(next: SellerOffer[]) {
    setSellerOffers(next);
    localStorage.setItem("linkly_seller_offers", JSON.stringify(next));
  }

  function handleSellerPostImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setAuthError("Post images must be smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSellerPostImage(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  function submitSellerPost(event: FormEvent) {
    event.preventDefault();
    if (!sellerPostTitle.trim() || !sellerPostDescription.trim() || !sellerPostQuantity.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const dailyPostData = JSON.parse(localStorage.getItem("linkly_seller_daily_posts") ?? '{"date":"","counts":{}}');
    const ownerEmail = authUser?.email.toLowerCase() ?? "";
    const currentCount = dailyPostData.date === today
      ? Number(dailyPostData.counts?.[ownerEmail] ?? dailyPostData.count) || 0
      : 0;
    if (!sellerSubscriptionActive && currentCount >= 3) {
      setShowSellerPostModal(false);
      setShowInboxUpgrade(true);
      return;
    }
    const sellerId = sellerPortalId || 1;
    const offer: SellerOffer = {
      id: `offer-${Date.now()}`,
      sellerId,
      ownerEmail,
      sellerName: authUser?.name && authUser.role !== "admin" ? authUser.name : sellers.find((seller) => seller.id === sellerId)?.name ?? "Marketplace seller",
      category: sellerPostCategory,
      title: sellerPostTitle.trim(),
      description: sellerPostDescription.trim(),
      quantity: sellerPostQuantity.trim(),
      unit: sellerPostUnit,
      country: sellerPostCountry.trim() || authUser?.country || "United Arab Emirates",
      price: sellerPostPrice.trim() || "Contact for price",
      comments: [],
      image: sellerPostImage || undefined,
    };
    persistSellerOffers([offer, ...sellerOffers]);
    if (!sellerSubscriptionActive) {
      const nextCount = currentCount + 1;
      const counts = dailyPostData.date === today ? dailyPostData.counts ?? {} : {};
      localStorage.setItem("linkly_seller_daily_posts", JSON.stringify({ date: today, counts: { ...counts, [ownerEmail]: nextCount } }));
      setSellerDailyPostCount(nextCount);
    }
    setSellerPostTitle("");
    setSellerPostDescription("");
    setSellerPostQuantity("");
    setSellerPostPrice("");
    setSellerPostCountry("");
    setSellerPostImage("");
    setShowSellerPostModal(false);
  }

  function submitOfferComment(event: FormEvent, offerId: string) {
    event.preventDefault();
    if (!authUser) return;
    if (authUser.role === "seller" && !sellerSubscriptionActive) return;
    const text = (offerCommentDraft[offerId] ?? "").trim();
    if (!text || text.length > 100) return;
    const digits = text.match(/\d/g)?.length ?? 0;
    if (digits > 4) {
      setAuthError("Comments can contain no more than four numerical characters.");
      return;
    }
    const comment: OfferComment = {
      id: `comment-${Date.now()}`,
      author: authUser.name,
      role: authUser.role === "seller" ? "seller" : "buyer",
      text,
      liked: false,
      createdAt: new Date().toISOString(),
    };
    persistSellerOffers(sellerOffers.map((offer) =>
      offer.id === offerId ? { ...offer, comments: [...offer.comments, comment] } : offer
    ));
    setOfferCommentDraft((current) => ({ ...current, [offerId]: "" }));
    setAuthError("");
  }

  function submitDiscoverSellerReply(event: FormEvent, offerId: string) {
    event.preventDefault();
    if (!sellerSubscriptionActive) {
      setShowInboxUpgrade(true);
      return;
    }
    const text = (offerCommentDraft[offerId] ?? "").trim();
    if (!text || text.length > 100) return;
    const digits = text.match(/\d/g)?.length ?? 0;
    if (digits > 4) {
      setAuthError("Comments can contain no more than four numerical characters.");
      return;
    }
    const comment: OfferComment = {
      id: `comment-${Date.now()}`,
      author: authUser?.name ?? "Seller account",
      role: "seller",
      text,
      liked: false,
      createdAt: new Date().toISOString(),
    };
    persistSellerOffers(sellerOffers.map((offer) =>
      offer.id === offerId ? { ...offer, comments: [...offer.comments, comment] } : offer
    ));
    setOfferCommentDraft((current) => ({ ...current, [offerId]: "" }));
    setAuthError("");
  }

  function toggleCommentLike(offerId: string, commentId: string) {
    persistSellerOffers(sellerOffers.map((offer) =>
      offer.id === offerId
        ? { ...offer, comments: offer.comments.map((comment) => comment.id === commentId ? { ...comment, liked: !comment.liked } : comment) }
        : offer
    ));
  }

  function cancelSuggestion(sellerId: number) {
    const next = [...cancelledIds, sellerId];
    setCancelledIds(next);
    localStorage.setItem("linkly_cancelled_suggestions", JSON.stringify(next));
  }

  function connectSeller() {
    if (!currentSeller || connectedIds.includes(currentSeller.id)) return;
    const next = [...connectedIds, currentSeller.id];
    setConnectedIds(next);
    localStorage.setItem("linkly_connections", JSON.stringify(next));
    cancelSuggestion(currentSeller.id);
    setActiveNav("Matches");
  }

  function activateSubscription() {
    setSubscriptionActive(true);
    localStorage.setItem("linkly_subscription", "active");
    setShowPricing(false);
    if (pendingNav) {
      setActiveNav(pendingNav);
      setPendingNav(null);
    }
  }

  function activateSellerSubscription() {
    setSellerSubscriptionActive(true);
    if (authUser) {
      localStorage.setItem(`linkly_seller_subscription:${authUser.email.toLowerCase()}`, "active");
    }
    setShowInboxUpgrade(false);
  }

  function submitAuthentication(event: FormEvent) {
    event.preventDefault();
    const email = authEmail.trim().toLowerCase();
    const password = authPassword;
    setAuthError("");

    if (!email || !password || (authMode === "register" && !authName.trim())) {
      setAuthError("Complete all required fields.");
      return;
    }

    if (authMode === "register") {
      if (!authPhone.trim() || !authCountry.trim()) {
        setAuthError("Phone number and country are required.");
        return;
      }
      const buyerAccounts = JSON.parse(localStorage.getItem("linkly_buyer_accounts") ?? "[]") as BuyerAccount[];
      const sellerAccounts = JSON.parse(localStorage.getItem("linkly_seller_accounts") ?? "[]") as SellerAccount[];
      if ([...buyerAccounts, ...sellerAccounts].some((account) => account.email.toLowerCase() === email)) {
        setAuthError("An account already exists for this email.");
        return;
      }

      const user: AuthUser = authAccountType === "buyer"
        ? {
            name: authName.trim(),
            email,
            phone: authPhone.trim(),
            country: authCountry.trim(),
            interests: authInterests,
            role: "buyer",
          }
        : {
            name: authName.trim(),
            email,
            phone: authPhone.trim(),
            country: authCountry.trim(),
            interests: [authCategory],
            role: "seller",
          };

      if (authAccountType === "buyer") {
        const account: BuyerAccount = {
          name: user.name,
          email,
          password,
          phone: user.phone ?? "",
          country: user.country ?? "",
          interests: authInterests,
        };
        localStorage.setItem("linkly_buyer_accounts", JSON.stringify([...buyerAccounts, account]));
      } else {
        const account: SellerAccount = {
          name: user.name,
          email,
          password,
          phone: user.phone ?? "",
          country: user.country ?? "",
          category: authCategory,
          companyName: user.name,
          tier: "free",
        };
        localStorage.setItem("linkly_seller_accounts", JSON.stringify([...sellerAccounts, account]));
      }

      localStorage.setItem("linkly_session", JSON.stringify(user));
      setAuthUser(user);
      setPortalRole(authAccountType);
      setDiscoverTestRole(authAccountType);
      setActiveNav(authAccountType === "seller" ? "Seller dashboard" : "Discover");
      return;
    }

    if (email === "admin@linkly.com" && password === "LinklyAdmin!2026") {
      const user: AuthUser = { name: "Linkly Administrator", email, role: "admin" };
      localStorage.setItem("linkly_session", JSON.stringify(user));
      setAuthUser(user);
      setPortalRole("seller");
      setDiscoverTestRole("seller");
      setActiveNav("Seller dashboard");
      return;
    }

    const accounts = JSON.parse(localStorage.getItem("linkly_buyer_accounts") ?? "[]") as BuyerAccount[];
    const account = accounts.find((item) => item.email.toLowerCase() === email && item.password === password);
    if (account) {
      const user: AuthUser = {
        name: account.name,
        email: account.email,
        phone: account.phone,
        country: account.country,
        interests: account.interests,
        role: "buyer",
      };
      localStorage.setItem("linkly_session", JSON.stringify(user));
      setAuthUser(user);
      setPortalRole("buyer");
      setDiscoverTestRole("buyer");
      setActiveNav("Discover");
      return;
    }

    const sellerAccounts = JSON.parse(localStorage.getItem("linkly_seller_accounts") ?? "[]") as SellerAccount[];
    const seller = sellerAccounts.find((item) => item.email.toLowerCase() === email && item.password === password);
    if (!seller) {
      setAuthError("Email or password is incorrect.");
      return;
    }
    const user: AuthUser = {
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      country: seller.country,
      interests: [seller.category],
      role: "seller",
    };
    localStorage.setItem("linkly_session", JSON.stringify(user));
    setAuthUser(user);
    setPortalRole("seller");
    setDiscoverTestRole("seller");
    setActiveNav("Seller dashboard");
  }

  function signOut() {
    localStorage.removeItem("linkly_session");
    localStorage.removeItem("linkly_portal_role");
    setAuthUser(null);
    setAuthPassword("");
    setAuthError("");
    setPortalRole("buyer");
    setDiscoverTestRole("buyer");
    setSellerPreviewMode("own");
    setActiveNav("Discover");
  }

  function getInitials(name: string) {
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function navigateMemberSection(section: string) {
    setActiveNav(section);
  }

  function sendChat(event: FormEvent) {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setMessages((current) => [...current, { from: "user", text }]);
    setChatInput("");
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { from: "bot", text: "I’ve added that requirement and ranked the verified sellers with active supply capacity." },
      ]);
    }, 500);
  }

  function getConversation(sellerId: number) {
    return threadMessages[sellerId] ?? [
      {
        sender: "seller" as const,
        text: "Thank you for your introduction. What monthly allocation are you seeking?",
        sentAt: new Date().toISOString(),
      },
      {
        sender: "buyer" as const,
        text: "We are looking for an initial allocation. Please share availability and trade terms.",
        sentAt: new Date().toISOString(),
      },
    ];
  }

  function persistConversation(sellerId: number, conversation: ChatMessage[]) {
    setThreadMessages((current) => {
      const next = { ...current, [sellerId]: conversation };
      localStorage.setItem("linkly_conversations", JSON.stringify(next));
      return next;
    });
  }

  function openConversation(sellerId: number) {
    setActiveSellerId(sellerId);
    setActiveNav("Messages");
    if (!threadMessages[sellerId]) {
      persistConversation(sellerId, getConversation(sellerId));
    }
  }

  function sendBuyerMessage(event: FormEvent) {
    event.preventDefault();
    const text = messageDraft.trim();
    const sellerId = activeSellerId && connectedIds.includes(activeSellerId)
      ? activeSellerId
      : connectedIds[0];
    if (!text || !sellerId) return;

    const conversation = getConversation(sellerId);
    const buyerMessage: ChatMessage = {
      sender: "buyer",
      text,
      sentAt: new Date().toISOString(),
    };
    persistConversation(sellerId, [...conversation, buyerMessage]);
    setMessageDraft("");

    window.setTimeout(() => {
      const sellerMessage: ChatMessage = {
        sender: "seller",
        text: "Thank you. Our trade desk has received your allocation request and will confirm availability, specifications and terms.",
        sentAt: new Date().toISOString(),
      };
      setThreadMessages((current) => {
        const next = {
          ...current,
        [sellerId]: [...(current[sellerId] ?? conversation), sellerMessage],
        };
        localStorage.setItem("linkly_conversations", JSON.stringify(next));
        return next;
      });
    }, 700);
  }

  const filteredRfqs = useMemo(() => {
    const query = procurementSearch.trim().toLowerCase();
    return rfqs.filter((rfq) => {
      const matchesStatus = procurementStatus === "All" || rfq.status === procurementStatus;
      const matchesSearch = !query || [
        rfq.id,
        rfq.title,
        rfq.commodity,
        rfq.specification,
        rfq.deliveryLocation,
      ].some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [procurementSearch, procurementStatus, rfqs]);

  const selectedRfq = rfqs.find((rfq) => rfq.id === selectedRfqId) ?? null;

  function persistRfqs(next: ProcurementRfq[]) {
    setRfqs(next);
    localStorage.setItem("linkly_rfqs", JSON.stringify(next));
  }

  function openNewRfq() {
    setEditingRfqId(null);
    setRfqForm(emptyRfqForm);
    setShowRfqModal(true);
  }

  function openEditRfq(rfq: ProcurementRfq) {
    setEditingRfqId(rfq.id);
    setRfqForm({
      title: rfq.title,
      commodity: rfq.commodity,
      specification: rfq.specification,
      quantity: rfq.quantity,
      unit: rfq.unit,
      targetDelivery: rfq.targetDelivery,
      deliveryLocation: rfq.deliveryLocation,
      incoterm: rfq.incoterm,
      closingDate: rfq.closingDate,
      budget: rfq.budget,
      notes: rfq.notes,
      supplierIds: rfq.supplierIds,
    });
    setShowRfqModal(true);
    setSelectedRfqId(null);
  }

  function saveRfq(event: FormEvent, publish: boolean) {
    event.preventDefault();
    if (!rfqForm.title.trim() || !rfqForm.quantity.trim() || !rfqForm.closingDate) return;

    if (editingRfqId) {
      const next = rfqs.map((rfq) => rfq.id === editingRfqId
        ? { ...rfq, ...rfqForm, status: publish ? "Published" as RfqStatus : rfq.status }
        : rfq);
      persistRfqs(next);
    } else {
      const highestReference = rfqs.reduce((highest, rfq) => {
        const value = Number(rfq.id.replace(/\D/g, ""));
        return Number.isFinite(value) ? Math.max(highest, value) : highest;
      }, 1040);
      const record: ProcurementRfq = {
        id: `RFQ-${highestReference + 1}`,
        ...rfqForm,
        status: publish ? "Published" : "Draft",
        quotes: [],
        createdAt: new Date().toISOString(),
      };
      persistRfqs([record, ...rfqs]);
    }
    setShowRfqModal(false);
    setEditingRfqId(null);
    setRfqForm(emptyRfqForm);
  }

  function updateRfqStatus(rfqId: string, status: RfqStatus) {
    persistRfqs(rfqStatusSet(rfqs, rfqId, status));
  }

  function rfqStatusSet(records: ProcurementRfq[], rfqId: string, status: RfqStatus) {
    return records.map((rfq) => rfq.id === rfqId ? { ...rfq, status } : rfq);
  }

  function deleteRfq(rfqId: string) {
    persistRfqs(rfqs.filter((rfq) => rfq.id !== rfqId));
    setSelectedRfqId(null);
  }

  function shortlistQuote(rfqId: string, sellerId: number) {
    persistRfqs(rfqs.map((rfq) => rfq.id === rfqId ? {
      ...rfq,
      status: "Evaluation",
      quotes: rfq.quotes.map((quote) => quote.sellerId === sellerId
        ? { ...quote, status: "Shortlisted" as const }
        : quote),
    } : rfq));
  }

  function awardQuote(rfqId: string, sellerId: number) {
    persistRfqs(rfqs.map((rfq) => rfq.id === rfqId ? {
      ...rfq,
      status: "Awarded",
      quotes: rfq.quotes.map((quote) => quote.sellerId === sellerId
        ? { ...quote, status: "Shortlisted" as const }
        : { ...quote, status: "Declined" as const }),
    } : rfq));
  }

  const filteredFinanceTransactions = useMemo(() => {
    const query = financeSearch.trim().toLowerCase();
    return financeTransactions.filter((transaction) => {
      const matchesQuery = !query || [
        transaction.id,
        transaction.counterparty,
        transaction.instrument,
        transaction.reference,
        transaction.status,
      ].some((value) => value.toLowerCase().includes(query));
      const matchesFilter =
        financeFilter === "All" ||
        (financeFilter === "Active" && ["Pending acceptance", "In custody", "Active", "Under review"].includes(transaction.status)) ||
        (financeFilter === "Pending" && ["Draft", "Pending documents", "Under review", "Pending acceptance"].includes(transaction.status)) ||
        (financeFilter === "Settled" && transaction.status === "Settled");
      return matchesQuery && matchesFilter;
    });
  }, [financeFilter, financeSearch, financeTransactions]);

  const selectedFinance = financeTransactions.find((transaction) => transaction.id === selectedFinanceId) ?? null;
  const outstandingFinance = financeTransactions
    .filter((transaction) => ["Pending acceptance", "In custody", "Active", "Under review"].includes(transaction.status))
    .reduce((total, transaction) => total + transaction.amount, 0);

  function persistFinanceTransactions(next: FinanceTransaction[]) {
    setFinanceTransactions(next);
    localStorage.setItem("linkly_finance", JSON.stringify(next));
  }

  function openFinanceApplication(instrument: FinanceInstrument = "Letter of credit") {
    const preferredSeller = sellers.find((seller) =>
      seller.status === "active" && connectedIds.includes(seller.id));
    setFinanceForm({
      instrument,
      counterparty: preferredSeller?.name ?? "",
      counterpartySellerId: preferredSeller ? String(preferredSeller.id) : "",
      amount: "",
      currency: "USD",
      maturityDate: "",
      reference: "",
      purpose: "",
    });
    setShowFinanceModal(true);
  }

  function submitFinanceApplication(event: FormEvent) {
    event.preventDefault();
    const amount = Number(financeForm.amount.replace(/[^0-9.]/g, ""));
    const sellerId = Number(financeForm.counterpartySellerId);
    const seller = sellers.find((item) =>
      item.id === sellerId &&
      item.status === "active" &&
      connectedIds.includes(item.id));
    if (!seller || !amount || !financeForm.maturityDate || !financeForm.reference.trim()) return;

    const highestReference = financeTransactions.reduce((highest, transaction) => {
      const numericId = Number(transaction.id.replace(/\D/g, ""));
      return Number.isFinite(numericId) ? Math.max(highest, numericId) : highest;
    }, 1100);
    const prefix = financeForm.instrument === "Letter of credit" ? "LC" : financeForm.instrument === "Escrow" ? "ESC" : financeForm.instrument === "Trade loan" ? "TL" : "BG";
    const transaction: FinanceTransaction = {
      id: `${prefix}-${highestReference + 1}`,
      instrument: financeForm.instrument,
      counterparty: seller.name,
      counterpartySellerId: seller.id,
      amount,
      currency: financeForm.currency,
      status: "Pending documents",
      maturityDate: financeForm.maturityDate,
      reference: financeForm.reference.trim(),
      purpose: financeForm.purpose.trim() || "Commodity trade financing application.",
      createdAt: new Date().toISOString(),
      documents: [],
    };
    persistFinanceTransactions([transaction, ...financeTransactions]);
    setShowFinanceModal(false);
    setSelectedFinanceId(transaction.id);
  }

  function updateFinanceStatus(transactionId: string, status: FinanceStatus) {
    persistFinanceTransactions(financeTransactions.map((transaction) =>
      transaction.id === transactionId ? { ...transaction, status } : transaction));
  }

  function exportFinanceTransactions() {
    const header = ["Reference", "Instrument", "Counterparty", "Amount", "Currency", "Status", "Maturity", "Purpose"];
    const rows = filteredFinanceTransactions.map((transaction) => [
      transaction.id,
      transaction.instrument,
      transaction.counterparty,
      transaction.amount,
      transaction.currency,
      transaction.status,
      transaction.maturityDate,
      transaction.reference,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "trade-finance-transactions.csv";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportRfqs() {
    const header = ["Reference", "Title", "Commodity", "Quantity", "Unit", "Delivery location", "Closing date", "Status", "Budget"];
    const rows = filteredRfqs.map((rfq) => [
      rfq.id,
      rfq.title,
      rfq.commodity,
      rfq.quantity,
      rfq.unit,
      rfq.deliveryLocation,
      rfq.closingDate,
      rfq.status,
      rfq.budget,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "procurement-rfqs.csv";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderOtherSellerPreview() {
    const otherOffers = sellerOffers.filter((offer) => offer.ownerEmail?.toLowerCase() !== authUser?.email.toLowerCase());
    const offer = otherOffers.length ? otherOffers[otherSellerIndex % otherOffers.length] : null;
    const sellerProfile = offer && !offer.ownerEmail ? sellers.find((seller) => seller.id === offer.sellerId) : null;
    const offerImage = offer?.image ?? sellerProfile?.image;
    if (!offer) {
      return <div className="empty-state"><Compass size={32} /><h2>No other seller products</h2><p>There are no eligible offers from other sellers right now.</p></div>;
    }
    return (
      <>
        <div className="seller-card seller-other-product-card">
          <div className="seller-photo">
            {offerImage ? <img src={offerImage} alt={offer.title} /> : <div className="seller-photo-placeholder"><PackageSearch size={34} /></div>}
            <div className="match-badge"><PackageSearch size={13} /> Other seller offer</div>
          </div>
          <div className="seller-info">
            <div className="seller-title-row"><div><p>{offer.category}</p><h2>{offer.title}</h2></div>{sellerProfile?.verified && <span className="verified"><Check size={12} /> Verified seller</span>}</div>
            <p className="location">{offer.sellerName} · {offer.country}</p>
            <p className="description">{offer.description}</p>
            <div className="trade-facts">
              <div><span>Available quantity</span><strong>{offer.quantity} {offer.unit}</strong></div>
              <div><span>Price</span><strong>{offer.price}</strong></div>
              <div><span>Trade terms</span><strong>Negotiable</strong></div>
            </div>
            {sellerProfile?.tags.length ? <div className="tag-row">{sellerProfile.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
          </div>
        </div>
        <div className="seller-browse-readonly-note"><ShieldCheck size={14} /> Read-only preview: comments and likes are unavailable for other sellers.</div>
        <div className="swipe-actions">
          <button className="pass-button" aria-label="Previous seller" onClick={() => setOtherSellerIndex((current) => (current - 1 + otherOffers.length) % otherOffers.length)}><ArrowLeft size={23} /></button>
          <button className="connect-button" onClick={() => sellerSubscriptionActive ? setActiveNav("Seller messages") : setShowInboxUpgrade(true)}>{sellerSubscriptionActive ? <MessageCircle size={17} /> : <Crown size={17} />} Request introduction</button>
          <button className="pass-button" aria-label="Next seller" onClick={() => setOtherSellerIndex((current) => (current + 1) % otherOffers.length)}><ArrowRight size={23} /></button>
        </div>
      </>
    );
  }

  const mySellerOffers = authUser?.role === "admin"
    ? sellerOffers
    : sellerOffers.filter((offer) => offer.ownerEmail?.toLowerCase() === authUser?.email.toLowerCase());

  if (!authReady) return null;

  if (!authUser) {
    return (
      <main className="auth-page">
        <section className="auth-brand-panel">
          <div className="brand-mark auth-brand"><span className="brand-gem"><Landmark size={15} /></span><span>linkly</span></div>
          <div className="auth-brand-copy">
            <p className="eyebrow">Verified commodity network</p>
            <h1>Trade with confidence.</h1>
            <p>Discover verified suppliers, manage procurement and route trade finance securely.</p>
          </div>
        </section>
        <section className="auth-panel">
          <form className="auth-card" onSubmit={submitAuthentication}>
            <p className="eyebrow">Secure access</p>
            <h2>{authMode === "login" ? "Welcome back" : "Create an account"}</h2>
            <p className="auth-subtitle">{authMode === "login" ? "Sign in to your dashboard." : "Choose the account type that matches how you use Linkly."}</p>
            <div className="auth-tabs">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Sign in</button>
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => { setAuthMode("register"); setAuthError(""); }}>Create account</button>
            </div>
            {authMode === "register" && (
              <>
                <div className="auth-account-type">
                  <button type="button" className={authAccountType === "buyer" ? "active" : ""} onClick={() => setAuthAccountType("buyer")}><strong>Buyer</strong><span>Find and contact sellers</span></button>
                  <button type="button" className={authAccountType === "seller" ? "active" : ""} onClick={() => setAuthAccountType("seller")}><strong>Seller</strong><span>Publish commodity offers</span></button>
                </div>
                <label>{authAccountType === "seller" ? "Business or seller name" : "Full name"}<input required value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder={authAccountType === "seller" ? "Aurum Trading Ltd" : "Maya Ortiz"} autoComplete="name" /></label>
              </>
            )}
            <label>Email address<input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" /></label>
            {authMode === "register" && (
              <>
                <label>Phone number<input type="tel" required value={authPhone} onChange={(event) => setAuthPhone(event.target.value)} placeholder="+971 55 000 0000" autoComplete="tel" /></label>
                <label>Country<input required value={authCountry} onChange={(event) => setAuthCountry(event.target.value)} placeholder="United Arab Emirates" autoComplete="country-name" /></label>
                {authAccountType === "buyer" ? (
                  <fieldset className="auth-interests">
                    <legend>What are you interested in?</legend>
                    {(["Gold", "Silver", "Timber Logs", "Precious Metals"] as Category[]).map((interest) => (
                      <label key={interest}><input type="checkbox" checked={authInterests.includes(interest)} onChange={(event) => setAuthInterests((current) => event.target.checked ? [...current, interest] : current.filter((item) => item !== interest))} /><span>{interest}</span></label>
                    ))}
                  </fieldset>
                ) : (
                  <label>Commodity you sell<select value={authCategory} onChange={(event) => setAuthCategory(event.target.value as Category)}><option>Gold</option><option>Silver</option><option>Timber Logs</option></select></label>
                )}
              </>
            )}
            <label>Password<input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Enter your password" autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>
            {authError && <div className="auth-error">{authError}</div>}
            <button className="auth-submit" type="submit">{authMode === "login" ? "Sign in" : authAccountType === "buyer" ? "Create buyer account" : "Create seller account"}<ArrowRight size={16} /></button>
            {authMode === "login" && (
              <div className="admin-demo">
                <strong>Supplier dashboard administrator</strong>
                <span>admin@linkly.com</span>
                <span>Password: LinklyAdmin!2026</span>
              </div>
            )}
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span className="brand-gem"><Landmark size={15} /></span><span>linkly</span></div>
        {portalRole === "buyer" ? (
          <>
            <nav className="main-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => navigateMemberSection(item.label)}>
                    <Icon size={19} />
                    <span>{item.label}</span>
                    {item.label === "Matches" && <b>{connectedIds.length}</b>}
                  </button>
                );
              })}
            </nav>
            <div className="sidebar-section">
              <p>Workspace</p>
              <button className={activeNav === "Procurement" ? "active" : ""} onClick={() => setActiveNav("Procurement")}><PackageSearch size={18} /> Procurement</button>
              <button className={activeNav === "Trade finance" ? "active" : ""} onClick={() => setActiveNav("Trade finance")}><CircleDollarSign size={18} /> Trade finance</button>
              <button className={activeNav === "Compliance" ? "active" : ""} onClick={() => setActiveNav("Compliance")}><ShieldCheck size={18} /> Compliance</button>
            </div>
          </>
        ) : (
          <>
            <nav className="main-nav">
              <button className={`nav-item ${activeNav === "Seller dashboard" ? "active" : ""}`} onClick={() => setActiveNav("Seller dashboard")}><ShieldCheck size={19} /><span>Supplier operations</span></button>
              <button className={`nav-item ${activeNav === "Seller messages" ? "active" : ""}`} onClick={() => setActiveNav("Seller messages")}><MessageCircle size={19} /><span>Messages</span><b>3</b></button>
              <button className={`nav-item ${activeNav === "RFQ queue" ? "active" : ""}`} onClick={() => setActiveNav("RFQ queue")}><PackageSearch size={19} /><span>RFQ queue</span><b>{rfqs.filter((rfq) => rfq.status !== "Cancelled" && rfq.status !== "Closed").length}</b></button>
              <button className={`nav-item ${activeNav === "Finance requests" ? "active" : ""}`} onClick={() => setActiveNav("Finance requests")}><CircleDollarSign size={19} /><span>Finance requests</span><b>{financeTransactions.filter((transaction) => !["Settled", "Declined"].includes(transaction.status)).length}</b></button>
            </nav>
          </>
        )}
        <button className="profile-card" onClick={signOut} title="Sign out">
          <div className="avatar">{getInitials(authUser.name)}</div>
          <div><strong>{authUser.name}</strong><span>{authUser.role === "admin" ? "Marketplace administrator" : authUser.role === "seller" ? "Registered seller" : "Registered buyer"}</span></div>
          <ChevronRight size={16} />
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-gem"><Landmark size={13} /></span> linkly</div>
          <div className="search-wrap">
            <div className="search-box"><Search size={17} /><input ref={searchInputRef} value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder={portalRole === "seller" ? "Search suppliers, requests, categories..." : "Search commodities, sellers, regions..."} /><kbd>⌘ K</kbd></div>
            {globalSearch.trim() && (
              <div className="search-results">
                {searchResults.length ? searchResults.map((result) => (
                  <button key={result.id} onClick={() => {
                    if (result.kind === "RFQ") {
                      setSelectedRfqId(String(result.id));
                      setActiveNav(portalRole === "seller" ? "RFQ queue" : "Procurement");
                    }
                    else {
                      setCategory("All commodities");
                      if (portalRole === "buyer") {
                        setActiveNav("Discover");
                      } else {
                        setActiveNav("Seller dashboard");
                        window.setTimeout(() => document.getElementById("supplier-directory")?.scrollIntoView({ behavior: "smooth" }), 0);
                      }
                    }
                    setGlobalSearch("");
                  }}>
                    <span><strong>{result.name}</strong><small>{result.detail}</small></span><b>{result.kind}</b>
                  </button>
                )) : <div className="search-empty">No matching suppliers or requests.</div>}
              </div>
            )}
          </div>
          <div className="top-actions">
            <button aria-label="Settings" onClick={() => openUtilityPanel("settings")}><Settings size={18} /></button>
            <button aria-label="Notifications" className="notification" onClick={() => openUtilityPanel("notifications")}><Bell size={18} />{!notificationsRead && <span />}</button>
            <button className="header-avatar" aria-label="Profile settings" onClick={() => openUtilityPanel("profile")}>{getInitials(authUser.name)}</button>
          </div>
        </header>

        {activeNav === "Discover" && (
          <section className="content-grid">
            <div className="discovery-column">
              <div className="page-heading">
                <div><p className="eyebrow"><Sparkles size={14} /> Verified commodity network</p><h1>{discoverTestRole === "buyer" ? "Discover suppliers" : "Seller offer preview"}</h1></div>
                <div className="discover-role-switch" role="group" aria-label="Preview Discover as buyer or seller">
                  <button type="button" className={discoverTestRole === "buyer" ? "active" : ""} onClick={() => setDiscoverTestRole("buyer")}>Buyer view</button>
                  <button type="button" className={discoverTestRole === "seller" ? "active" : ""} onClick={() => setDiscoverTestRole("seller")}>Seller view</button>
                </div>
              </div>

              {discoverTestRole === "seller" ? (
                <div className="seller-discover-preview">
                  <div className="seller-preview-heading">
                    <div><strong>{sellerPreviewMode === "own" ? "Your published offers" : "Other seller products"}</strong><span>{sellerPreviewMode === "own" ? `${mySellerOffers.length} live marketplace offers` : "Read-only seller discovery"}</span></div>
                    <div className="seller-post-actions">
                      <button type="button" className={sellerPreviewMode === "own" ? "seller-new-post-button" : ""} onClick={() => setSellerPreviewMode("own")}>My products</button>
                      <button type="button" className={sellerPreviewMode === "other" ? "seller-new-post-button" : ""} onClick={() => setSellerPreviewMode("other")}><Compass size={15} /> See other sellers&apos; products</button>
                    </div>
                  </div>
                  {sellerPreviewMode === "own" ? (
                    <>
                      <div className="seller-own-post-toolbar">
                        {!sellerSubscriptionActive && <span className="daily-post-limit">{Math.max(0, 3 - sellerDailyPostCount)} free posts left today</span>}
                        <button type="button" className="seller-new-post-button" onClick={() => setShowSellerPostModal(true)}><Plus size={15} /> New post</button>
                        <button type="button" onClick={() => setActiveNav("Seller dashboard")}>Manage offers</button>
                      </div>
                      {mySellerOffers.map((offer) => {
                    const linkedSeller = offer.ownerEmail ? null : sellers.find((seller) => seller.id === offer.sellerId);
                    return (
                      <article className="seller-offer-preview-card" key={offer.id}>
                        <div className="seller-offer-preview-top">
                          {offer.image && <img className="seller-post-image" src={offer.image} alt={offer.title} />}
                          <div><span>{offer.category}</span><h2>{offer.title}</h2><p>{offer.description}</p></div>
                          {linkedSeller?.verified && <b className="verified"><Check size={12} /> Verified seller</b>}
                        </div>
                        <div className="trade-facts">
                          <div><span>Available quantity</span><strong>{offer.quantity} {offer.unit}</strong></div>
                          <div><span>Origin</span><strong>{offer.country}</strong></div>
                          <div><span>Pricing</span><strong>{offer.price}</strong></div>
                        </div>
                        <div className="offer-comments-card">
                          <div className="offer-comments-heading"><div><strong>Buyer comments</strong><span>{offer.comments.length} comments</span></div></div>
                          {offer.comments.map((comment) => (
                            <div className="offer-comment" key={comment.id}>
                              <div><strong>{comment.author}</strong><span>{comment.role === "seller" ? "Seller reply" : "Buyer"}</span></div>
                              <p>{comment.text}</p>
                              <button className={comment.liked ? "liked" : ""} type="button" aria-label={comment.liked ? "Unlike comment" : "Like comment"} onClick={() => toggleCommentLike(offer.id, comment.id)}><Heart size={13} fill={comment.liked ? "currentColor" : "none"} />{comment.liked ? "Liked" : "Like"}</button>
                            </div>
                          ))}
                          {offer.comments.length === 0 && <p className="seller-preview-empty">No buyer comments yet.</p>}
                          {sellerSubscriptionActive ? (
                            <form className="offer-comment-form" onSubmit={(event) => submitDiscoverSellerReply(event, offer.id)}>
                              <input maxLength={100} value={offerCommentDraft[offer.id] ?? ""} onChange={(event) => setOfferCommentDraft((current) => ({ ...current, [offer.id]: event.target.value }))} placeholder="Reply to the buyer..." />
                              <button aria-label="Post seller reply"><ArrowRight size={16} /></button>
                            </form>
                          ) : (
                            <button className="comment-upgrade" type="button" onClick={() => setShowInboxUpgrade(true)}><Crown size={14} /> Upgrade to Pro to reply to comments</button>
                          )}
                        </div>
                      </article>
                    );
                      })}
                      {!mySellerOffers.length && <div className="empty-state"><PackageSearch size={30} /><h2>No posts yet</h2><p>Create a post to make your products visible to buyers.</p><button onClick={() => setShowSellerPostModal(true)}>Create a post</button></div>}
                    </>
                  ) : renderOtherSellerPreview()}
                </div>
              ) : (
                <>
              <div className="category-row">
                {categoryFilters.map((item) => (
                  <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
                ))}
              </div>

              {currentSeller ? (
                <>
                  <div className="seller-card">
                    <div className="seller-photo">
                      <img src={currentSeller.image} alt={currentSeller.name} />
                      <div className="match-badge"><Sparkles size={13} /> {currentSeller.match}% match</div>
                      <button className="save-button" aria-label="Cancel this suggestion" onClick={() => cancelSuggestion(currentSeller.id)}><X size={19} /></button>
                    </div>
                    <div className="seller-info">
                      <div className="seller-title-row">
                        <div><p>{currentSeller.category}</p><h2>{currentSeller.name}</h2></div>
                        {currentSeller.verified && <span className="verified"><Check size={12} /> Verified seller</span>}
                      </div>
                      <p className="location">{currentSeller.location}, {currentSeller.country}</p>
                      <p className="description">{currentSeller.description}</p>
                      <div className="trade-facts">
                        <div><span>Supply capacity</span><strong>{currentSeller.capacity}</strong></div>
                        <div><span>Specification</span><strong>{currentSeller.purity}</strong></div>
                        <div><span>Trade terms</span><strong>Negotiable</strong></div>
                      </div>
                      <div className="tag-row">{currentSeller.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    </div>
                  </div>
                  {(() => {
                    const offer = sellerOffers.find((item) => item.sellerId === currentSeller.id) ?? sellerOffers[0];
                    if (!offer) return null;
                    return (
                      <div className="offer-comments-card">
                        <div className="offer-comments-heading"><div><strong>Buyer comments</strong><span>{offer.comments.length} comments</span></div>{authUser?.role === "buyer" && <button onClick={() => openConversation(currentSeller.id)}><MessageCircle size={15} /> Message seller</button>}</div>
                        {offer.comments.map((comment) => (
                          <div className="offer-comment" key={comment.id}>
                            <div><strong>{comment.author}</strong><span>{comment.role === "seller" ? "Seller reply" : "Buyer"}</span></div>
                            <p>{comment.text}</p>
                            {(authUser?.role === "seller" || authUser?.role === "admin") && (
                              <button className={comment.liked ? "liked" : ""} aria-label={comment.liked ? "Unlike comment" : "Like comment"} onClick={() => toggleCommentLike(offer.id, comment.id)}><Heart size={13} fill={comment.liked ? "currentColor" : "none"} />{comment.liked ? "Liked" : "Like"}</button>
                            )}
                          </div>
                        ))}
                        {authUser?.role === "buyer" ? (
                          <form className="offer-comment-form" onSubmit={(event) => submitOfferComment(event, offer.id)}>
                            <input maxLength={100} value={offerCommentDraft[offer.id] ?? ""} onChange={(event) => setOfferCommentDraft((current) => ({ ...current, [offer.id]: event.target.value }))} placeholder="Ask about quantity, delivery or terms..." />
                            <button aria-label="Post comment"><ArrowRight size={16} /></button>
                          </form>
                        ) : sellerSubscriptionActive ? (
                          <form className="offer-comment-form" onSubmit={(event) => submitOfferComment(event, offer.id)}>
                            <input maxLength={100} value={offerCommentDraft[offer.id] ?? ""} onChange={(event) => setOfferCommentDraft((current) => ({ ...current, [offer.id]: event.target.value }))} placeholder="Reply to the buyer..." />
                            <button aria-label="Post seller reply"><ArrowRight size={16} /></button>
                          </form>
                        ) : (
                          <button className="comment-upgrade" onClick={() => setShowInboxUpgrade(true)}><Crown size={14} /> Upgrade to Pro to reply to comments</button>
                        )}
                      </div>
                    );
                  })()}
                  <div className="swipe-actions">
                    <button className="pass-button" onClick={() => cancelSuggestion(currentSeller.id)} aria-label="Cancel suggestion"><X size={23} /></button>
                    <button className="connect-button" onClick={connectSeller}>
                      <Heart size={18} fill="currentColor" />
                      Request introduction
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <ShieldCheck size={32} />
                  <h2>No eligible suggestions</h2>
                  <p>All available suggestions for this filter are connected, cancelled or no longer active.</p>
                  <button onClick={() => setCancelledIds([])}>Reset cancelled suggestions</button>
                </div>
              )}
                </>
              )}
            </div>

            <aside className="insights-column">
              <div className="insight-card plan-card">
                <div className="plan-icon"><Crown size={18} /></div>
                <div><p>Seller network</p><h3>Eligible matches unlocked</h3></div>
                <button onClick={() => setActiveNav("Matches")}>View matches</button>
                <div className="progress"><span style={{ width: "100%" }} /></div>
              </div>
              <div className="insight-card activity-card">
                <div className="card-heading"><h3>Marketplace activity</h3><button>30 days</button></div>
                <div className="activity-grid">
                  <div><strong>18</strong><span>Views</span></div>
                  <div><strong>{connectedIds.length}</strong><span>Matches</span></div>
                  <div><strong>5</strong><span>Requests</span></div>
                </div>
              </div>
              <div className="insight-card categories-card">
                <div className="card-heading"><h3>Supply demand</h3><button>Manage</button></div>
                {[["Gold", "14 verified", 92], ["Silver", "11 verified", 74], ["Timber logs", "8 verified", 58], ["Precious metals", "7 verified", 49]].map(([name, count, width]) => (
                  <div className="category-bar-row" key={name as string}>
                    <div><span>{name}</span><small>{count}</small></div>
                    <div className="category-bar"><span style={{ width: `${width}%` }} /></div>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        )}

        {activeNav === "Procurement" && (
          <section className="module-page">
            <div className="module-heading workspace-heading">
              <div><p className="eyebrow">Sourcing workspace</p><h1>Procurement</h1></div>
              <button className="primary-action" onClick={openNewRfq}><Plus size={16} /> New RFQ</button>
            </div>
            <div className="workspace-tabs">
              <button className="active" onClick={() => setActiveNav("Procurement")}>Procurement</button>
              <button onClick={() => setActiveNav("Trade finance")}>Trade finance</button>
              <button onClick={() => setActiveNav("Compliance")}>Compliance</button>
            </div>
            <div className="workspace-stats">
              <article><span>Active RFQs</span><strong>{rfqs.filter((rfq) => !["Closed", "Cancelled", "Draft"].includes(rfq.status)).length}</strong><small>{rfqs.filter((rfq) => rfq.status === "Quotes received").length} awaiting review</small></article>
              <article><span>Purchase orders</span><strong>7</strong><small>$1.84M committed</small></article>
              <article><span>Avg. quote time</span><strong>18h</strong><small>4 hours faster this month</small></article>
            </div>
            <div className="workspace-card">
              <div className="workspace-card-heading rfq-heading">
                <div><h2>Requests for quotation</h2><p>{filteredRfqs.length} of {rfqs.length} requests</p></div>
                <button className="export-button" onClick={exportRfqs}><Download size={14} /> Export CSV</button>
              </div>
              <div className="rfq-toolbar">
                <label className="rfq-search"><Search size={15} /><input value={procurementSearch} onChange={(event) => setProcurementSearch(event.target.value)} placeholder="Search reference, title or location..." /></label>
                <label className="rfq-status-filter"><SlidersHorizontal size={14} /><select value={procurementStatus} onChange={(event) => setProcurementStatus(event.target.value as "All" | RfqStatus)}><option>All</option><option>Draft</option><option>Published</option><option>Quotes received</option><option>Evaluation</option><option>Awarded</option><option>Closed</option><option>Cancelled</option></select></label>
              </div>
              <div className="procurement-table">
                <div className="table-row table-head"><span>Reference</span><span>Request</span><span>Quantity</span><span>Closing date</span><span>Status</span><span /></div>
                {filteredRfqs.map((rfq) => (
                  <div className="table-row rfq-row" key={rfq.id}>
                    <strong>{rfq.id}</strong>
                    <div className="rfq-title-cell"><strong>{rfq.title}</strong><span>{rfq.commodity} · {rfq.quotes.length} quote{rfq.quotes.length === 1 ? "" : "s"}</span></div>
                    <span>{rfq.quantity} {rfq.unit}</span>
                    <span className="date-cell"><CalendarDays size={13} /> {new Date(`${rfq.closingDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    <span><b className={`status-pill ${rfq.status === "Draft" ? "draft" : rfq.status === "Awarded" ? "success" : rfq.status === "Cancelled" ? "cancelled" : ""}`}>{rfq.status}</b></span>
                    <button aria-label={`Open ${rfq.id}`} onClick={() => setSelectedRfqId(rfq.id)}><ChevronRight size={16} /></button>
                  </div>
                ))}
                {!filteredRfqs.length && <div className="rfq-empty"><Search size={24} /><strong>No RFQs found</strong><span>Try another status or search term.</span><button onClick={() => { setProcurementSearch(""); setProcurementStatus("All"); }}>Clear filters</button></div>}
              </div>
            </div>
          </section>
        )}

        {activeNav === "Trade finance" && (
          <section className="module-page">
            <div className="module-heading workspace-heading">
              <div><p className="eyebrow">Secure settlement</p><h1>Trade finance</h1></div>
              <button className="primary-action" onClick={() => openFinanceApplication()}><FileText size={16} /> Request financing</button>
            </div>
            <div className="workspace-tabs">
              <button onClick={() => setActiveNav("Procurement")}>Procurement</button>
              <button className="active" onClick={() => setActiveNav("Trade finance")}>Trade finance</button>
              <button onClick={() => setActiveNav("Compliance")}>Compliance</button>
            </div>
            <div className="workspace-stats finance-stats">
              <article><span>Available facility</span><strong>$2.5M</strong><small>Revolving credit line</small></article>
              <article><span>Outstanding</span><strong>${(outstandingFinance / 1000).toFixed(0)}K</strong><small>Across {financeTransactions.filter((transaction) => ["Pending acceptance", "In custody", "Active", "Under review"].includes(transaction.status)).length} transactions</small></article>
              <article><span>Next settlement</span><strong>{financeTransactions.find((transaction) => ["Pending acceptance", "In custody", "Active"].includes(transaction.status))?.maturityDate ? new Date(`${financeTransactions.find((transaction) => ["Pending acceptance", "In custody", "Active"].includes(transaction.status))?.maturityDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None"}</strong><small>{financeTransactions.find((transaction) => ["Pending acceptance", "In custody", "Active"].includes(transaction.status))?.instrument ?? "No active instrument"}</small></article>
            </div>
            <div className="workspace-grid">
              <div className="workspace-card">
                <div className="workspace-card-heading">
                  <div><h2>Trade transactions</h2><p>{filteredFinanceTransactions.length} of {financeTransactions.length} instruments</p></div>
                  <button className="export-button" onClick={exportFinanceTransactions}><Download size={14} /> Export CSV</button>
                </div>
                <div className="finance-toolbar">
                  <label className="rfq-search"><Search size={15} /><input value={financeSearch} onChange={(event) => setFinanceSearch(event.target.value)} placeholder="Search reference, counterparty or status..." /></label>
                  <div className="finance-filter-tabs" aria-label="Transaction filters">
                    {(["All", "Active", "Pending", "Settled"] as const).map((filter) => (
                      <button key={filter} className={financeFilter === filter ? "active" : ""} onClick={() => setFinanceFilter(filter)}>{filter}</button>
                    ))}
                  </div>
                </div>
                <div className="finance-list">
                  {filteredFinanceTransactions.length ? filteredFinanceTransactions.map((transaction) => (
                    <button className="finance-row finance-row-button" key={transaction.id} onClick={() => setSelectedFinanceId(transaction.id)}>
                      <div><strong>{transaction.id}</strong><span>{transaction.instrument} · {transaction.counterparty}</span></div>
                      <b>{transaction.currency} {transaction.amount.toLocaleString("en-US")}</b>
                      <span className={`status-pill ${transaction.status === "Settled" ? "success" : transaction.status === "Declined" ? "declined" : ""}`}>{transaction.status}</span>
                      <ChevronRight size={15} />
                    </button>
                  )) : (
                    <div className="finance-empty">No transactions match this view.</div>
                  )}
                </div>
              </div>
              <div className="workspace-card risk-card">
                <div className="workspace-card-heading"><div><h2>Trade health</h2><p>Portfolio risk indicators</p></div></div>
                <div className="risk-ring"><strong>92</strong><span>Low risk</span></div>
                <div className="risk-metric"><span>Verified counterparties</span><strong>100%</strong></div>
                <div className="risk-metric"><span>Document compliance</span><strong>96%</strong></div>
                <button className="facility-button" onClick={() => openFinanceApplication("Trade loan")}><Landmark size={15} /> Apply for facility increase</button>
              </div>
            </div>
          </section>
        )}

        {portalRole === "buyer" && activeNav === "Compliance" && (
          <section className="module-page">
            <div className="module-heading workspace-heading">
              <div><p className="eyebrow">Risk and documentation</p><h1>Compliance</h1></div>
              <button className="primary-action" onClick={() => alert("Document upload interface opened.")}><Plus size={16} /> Upload document</button>
            </div>
            <div className="workspace-tabs">
              <button onClick={() => setActiveNav("Procurement")}>Procurement</button>
              <button onClick={() => setActiveNav("Trade finance")}>Trade finance</button>
              <button className="active" onClick={() => setActiveNav("Compliance")}>Compliance</button>
            </div>
            <div className="workspace-grid compliance-grid">
              <div className="workspace-card">
                <div className="workspace-card-heading"><div><h2>Company verification</h2><p>Complete requirements before trading</p></div><span className="completion-label">{Object.values(complianceChecks).filter(Boolean).length}/5 complete</span></div>
                <div className="checklist">
                  {[["kyb", "Business registration (KYB)"], ["beneficialOwners", "Beneficial ownership declarations"], ["sanctions", "Sanctions screening report"], ["origin", "Commodity origin evidence"], ["insurance", "Cargo and product insurance"]].map(([key, label]) => (
                    <label key={key}><input type="checkbox" checked={complianceChecks[key]} onChange={(event) => setComplianceChecks((current) => ({ ...current, [key]: event.target.checked }))} /><span className="custom-check">{complianceChecks[key] && <Check size={12} />}</span><span>{label}</span><small>{complianceChecks[key] ? "Complete" : "Required"}</small></label>
                  ))}
                </div>
              </div>
              <div className="workspace-card">
                <div className="workspace-card-heading"><div><h2>Seller screening</h2><p>Latest counterparty checks</p></div></div>
                <div className="screening-list">
                  {["Aurum Refinery Group", "Nordic Silver Works", "Cedar Valley Timber"].map((name, index) => (
                    <div className="screening-row" key={name}><div className="mini-avatar">{name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div><strong>{name}</strong><span>Screening completed</span></div><b className={index === 2 ? "warning" : ""}>{index === 2 ? "Review" : "Clear"}</b></div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {authUser.role === "seller" && activeNav === "Seller dashboard" && (
          <section className="module-page seller-dashboard">
            <div className="module-heading workspace-heading">
              <div><p className="eyebrow">Seller workspace</p><h1>Your marketplace</h1></div>
              <button className="primary-action" onClick={() => setShowSellerPostModal(true)}><Plus size={15} /> New post</button>
            </div>
            <div className="workspace-stats seller-stats">
              <article><span>Your live offers</span><strong>{mySellerOffers.length}</strong><small>Visible to buyers on Discover</small></article>
              <article><span>Posting plan</span><strong>{sellerSubscriptionActive ? "Pro" : "Free"}</strong><small>{sellerSubscriptionActive ? "Unlimited daily posts" : `${Math.max(0, 3 - sellerDailyPostCount)} free posts left today`}</small></article>
              <article><span>Seller network</span><strong>Browse</strong><small>Explore offers from other sellers</small></article>
              <article><span>Comments</span><strong>{mySellerOffers.reduce((total, offer) => total + offer.comments.length, 0)}</strong><small>Buyer activity on your offers</small></article>
            </div>
            <div className="workspace-card">
              <div className="workspace-card-heading">
                <div><h2>Explore the seller network</h2><p>Browse other sellers' offers as read-only cards. Introductions require Seller Pro.</p></div>
                <button className="primary-action" onClick={() => { setDiscoverTestRole("seller"); setSellerPreviewMode("other"); setActiveNav("Discover"); }}><Compass size={15} /> See other sellers&apos; products</button>
              </div>
            </div>
            <div className="workspace-card">
              <div className="workspace-card-heading"><div><h2>Your products</h2><p>Offers published from this seller account</p></div></div>
              <div className="seller-inbox-list">
                {mySellerOffers.length ? mySellerOffers.map((offer) => (
                  <div className="seller-inbox-row" key={offer.id}>
                    <div className="mini-avatar">{offer.category.slice(0, 2).toUpperCase()}</div>
                    <div><strong>{offer.title}</strong><span>{offer.category} · {offer.quantity} {offer.unit} · {offer.country}</span></div>
                    <b>{offer.comments.length} comments</b>
                    <ArrowRight size={16} />
                  </div>
                )) : <p className="seller-preview-empty">No offers yet. Create a post to list a product.</p>}
              </div>
            </div>
          </section>
        )}

        {authUser.role === "admin" && activeNav === "Seller dashboard" && (
          <section className="module-page seller-dashboard">
            <div className="module-heading workspace-heading">
              <div><p className="eyebrow">Linkly marketplace operations</p><h1>Supplier management</h1></div>
              <button className="secondary-action" onClick={signOut}>Sign out</button>
            </div>
            <div className="workspace-stats seller-stats">
              <article><span>Active suppliers</span><strong>{sellers.filter((seller) => managedSellerStatuses[seller.id] === "active").length}</strong><small>{sellers.filter((seller) => seller.verified).length} verified providers</small></article>
              <article><span>Buyer introductions</span><strong>{connectedIds.length}</strong><small>Active commercial connections</small></article>
              <article><span>Open procurement</span><strong>{rfqs.filter((rfq) => !["Cancelled", "Closed"].includes(rfq.status)).length}</strong><small>Across all supplier invitations</small></article>
              <article><span>Finance requests</span><strong>{financeTransactions.filter((transaction) => !["Settled", "Declined"].includes(transaction.status)).length}</strong><small>Awaiting marketplace action</small></article>
            </div>
            <div className="workspace-card supplier-directory-card" id="supplier-directory">
              <div className="workspace-card-heading">
                <div><h2>Supplier directory</h2><p>Manage verification, availability and marketplace access</p></div>
              </div>
              <div className="supplier-directory-header"><span>Supplier</span><span>Commodity</span><span>Capacity</span><span>Status</span><span>Action</span></div>
              <div className="supplier-directory">
                {sellers.map((seller) => {
                  const status = managedSellerStatuses[seller.id] ?? seller.status;
                  return (
                    <div className="supplier-directory-row" key={seller.id}>
                      <div className="supplier-name"><div className="mini-avatar">{seller.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div><strong>{seller.name}</strong><span>{seller.location}, {seller.country}</span></div></div>
                      <div><strong>{seller.category}</strong><span>{seller.purity}</span></div>
                      <div><strong>{seller.capacity}</strong><span>{seller.verified ? "Verified supplier" : "Pending verification"}</span></div>
                      <b className={status === "active" ? "supplier-status active" : "supplier-status"}>{status}</b>
                      <button className="supplier-action" onClick={() => setManagedSellerStatuses((current) => ({ ...current, [seller.id]: status === "active" ? "paused" : "active" }))}>
                        {status === "active" ? "Pause" : "Activate"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {portalRole === "seller" && activeNav === "Seller messages" && (
          <section className="module-page">
            <div className="module-heading workspace-heading">
              <div><p className="eyebrow">Buyer inquiries</p><h1>Messages</h1></div>
              {!sellerSubscriptionActive && <button className="primary-action" onClick={() => setShowInboxUpgrade(true)}><Crown size={15} /> Upgrade to Pro</button>}
            </div>
            <div className="workspace-card seller-inbox-card">
              <div className="workspace-card-heading"><div><h2>Inbox</h2><p>{sellerSubscriptionActive ? "Buyer conversations available" : "Free tier: sender names and message counts only"}</p></div></div>
              <div className="seller-inbox-list">
                {[
                  { name: "Maya Ortiz", company: "Orbit Industrial Buyers", count: 4 },
                  { name: "Daniel Brooks", company: "Northbridge Metals", count: 2 },
                  { name: "Amira Hassan", company: "Atlas Procurement", count: 7 },
                ].map((inbox) => (
                  <button className="seller-inbox-row" key={inbox.name} onClick={() => !sellerSubscriptionActive && setShowInboxUpgrade(true)}>
                    <div className="mini-avatar">{inbox.name.split(" ").map((word) => word[0]).join("")}</div>
                    <div><strong>{inbox.name}</strong><span>{inbox.company}</span></div>
                    <b>{inbox.count} messages</b>
                    {sellerSubscriptionActive ? <ArrowRight size={16} /> : <LockKeyhole size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {portalRole === "seller" && activeNav === "RFQ queue" && (
          <section className="module-page">
            <div className="module-heading workspace-heading">
              <div><p className="eyebrow">Network procurement</p><h1>RFQ queue</h1></div>
            </div>
            <div className="workspace-stats seller-stats">
              <article><span>Active RFQs</span><strong>{rfqs.filter((rfq) => rfq.status !== "Cancelled" && rfq.status !== "Closed").length}</strong><small>Open marketplace requests</small></article>
              <article><span>Quotes received</span><strong>{rfqs.reduce((total, rfq) => total + rfq.quotes.length, 0)}</strong><small>Supplier responses submitted</small></article>
              <article><span>Awaiting award</span><strong>{rfqs.filter((rfq) => rfq.status === "Evaluation" || rfq.status === "Quotes received").length}</strong><small>Requiring buyer action</small></article>
            </div>
            <div className="workspace-card">
              <div className="workspace-card-heading"><div><h2>All procurement requests</h2><p>RFQs distributed across the supplier network</p></div></div>
              <div className="seller-request-list">
                {rfqs.map((rfq) => (
                  <button className="seller-request-row" key={rfq.id} onClick={() => setSelectedRfqId(rfq.id)}>
                    <div><strong>{rfq.title}</strong><span>{rfq.id} · {rfq.quantity} {rfq.unit} · {rfq.supplierIds.length} invited suppliers · {rfq.commodity}</span></div>
                    <b>{rfq.status}</b><ChevronRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {portalRole === "seller" && activeNav === "Finance requests" && (
          <section className="module-page">
            <div className="module-heading workspace-heading">
              <div><p className="eyebrow">Network settlement</p><h1>Finance requests</h1></div>
            </div>
            <div className="workspace-stats seller-stats">
              <article><span>Open applications</span><strong>{financeTransactions.filter((transaction) => !["Settled", "Declined"].includes(transaction.status)).length}</strong><small>Awaiting marketplace action</small></article>
              <article><span>Under review</span><strong>{financeTransactions.filter((transaction) => ["Pending documents", "Under review", "Pending acceptance"].includes(transaction.status)).length}</strong><small>Review pipeline</small></article>
              <article><span>Settled</span><strong>{financeTransactions.filter((transaction) => transaction.status === "Settled").length}</strong><small>Completed transactions</small></article>
            </div>
            <div className="workspace-card">
              <div className="workspace-card-heading"><div><h2>All finance applications</h2><p>Buyer requests routed to eligible suppliers</p></div></div>
              <div className="seller-request-list">
                {financeTransactions.map((transaction) => (
                  <button className="seller-request-row" key={transaction.id} onClick={() => setSelectedFinanceId(transaction.id)}>
                    <div><strong>{transaction.instrument}</strong><span>{transaction.id} · {transaction.counterparty} · {transaction.currency} {transaction.amount.toLocaleString("en-US")} · {transaction.reference}</span></div>
                    <b>{transaction.status}</b><ChevronRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeNav === "Matches" && (
          <section className="module-page">
            <div className="module-heading"><div><p className="eyebrow">Introductions</p><h1>Your matches</h1></div></div>
            {connectedIds.length ? (
              <div className="match-list">
                {sellers.filter((seller) => connectedIds.includes(seller.id)).map((seller) => (
                  <article className="match-row" key={seller.id}>
                    <img src={seller.image} alt="" />
                    <div><span>{seller.category}</span><h2>{seller.name}</h2><p>{seller.location} · {seller.capacity}</p></div>
                    <button onClick={() => openConversation(seller.id)}><MessageCircle size={16} /> Open chat</button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><Heart size={32} /><h2>No introductions yet</h2><p>Connect with an eligible supplier to start a conversation.</p><button onClick={() => setActiveNav("Discover")}>Discover suppliers</button></div>
            )}
          </section>
        )}

        {activeNav === "Messages" && (
          <section className="module-page">
            <div className="module-heading"><div><p className="eyebrow">Secure correspondence</p><h1>Messages</h1></div></div>
            {connectedIds.length ? (
              <div className="messages-layout">
                <aside>
                  {sellers.filter((seller) => connectedIds.includes(seller.id)).map((seller) => {
                    const conversation = getConversation(seller.id);
                    const lastMessage = conversation[conversation.length - 1];
                    return (
                      <button
                        key={seller.id}
                        className={`conversation ${activeSellerId === seller.id ? "active" : ""}`}
                        onClick={() => openConversation(seller.id)}
                      >
                        <div className="mini-avatar">{seller.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div>
                        <div><strong>{seller.name}</strong><span>{lastMessage?.text ?? "Start a conversation"}</span></div>
                        <b>{conversation.length}</b>
                      </button>
                    );
                  })}
                </aside>
                <div className="message-thread">
                  {(() => {
                    const seller = sellers.find((item) => item.id === (activeSellerId ?? connectedIds[0]));
                    if (!seller) return null;
                    const conversation = getConversation(seller.id);
                    return (
                      <>
                        <div className="thread-heading">
                          <div className="mini-avatar">{seller.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div>
                          <div><strong>{seller.name}</strong><span><i /> Verified seller</span></div>
                        </div>
                        <div className="thread-body" aria-live="polite">
                          {conversation.map((message, index) => (
                            <div key={`${message.sentAt}-${index}`} className={`bubble ${message.sender}`}>
                              <span>{message.sender === "buyer" ? "Buyer" : seller.name}</span>
                              {message.text}
                            </div>
                          ))}
                        </div>
                        <form className="thread-form" onSubmit={sendBuyerMessage}>
                          <input
                            value={messageDraft}
                            onChange={(event) => setMessageDraft(event.target.value)}
                            placeholder="Write a secure message..."
                            aria-label="Message"
                          />
                          <button aria-label="Send message"><ArrowRight size={18} /></button>
                        </form>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="empty-state"><MessageCircle size={32} /><h2>No conversations available</h2><p>Connect with a verified seller to start messaging.</p><button onClick={() => setActiveNav("Discover")}>Discover suppliers</button></div>
            )}
          </section>
        )}
      </main>

      {showFinanceModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Request trade financing">
          <form className="rfq-modal finance-modal" onSubmit={submitFinanceApplication}>
            <div className="rfq-modal-header">
              <div><p className="eyebrow">Secure transaction</p><h2>Request trade financing</h2></div>
              <button type="button" onClick={() => setShowFinanceModal(false)}><X size={18} /></button>
            </div>
            <div className="rfq-modal-body">
              <label>Financing instrument<select required value={financeForm.instrument} onChange={(event) => setFinanceForm({ ...financeForm, instrument: event.target.value as FinanceInstrument })}><option>Letter of credit</option><option>Escrow</option><option>Trade loan</option><option>Bank guarantee</option></select></label>
              <label>Verified counterparty<select
                required
                value={financeForm.counterpartySellerId}
                onChange={(event) => {
                  const sellerId = Number(event.target.value);
                  const seller = sellers.find((item) => item.id === sellerId);
                  setFinanceForm({ ...financeForm, counterpartySellerId: event.target.value, counterparty: seller?.name ?? "" });
                }}
              >
                {!connectedIds.length && <option value="">No connected sellers available</option>}
                {sellers.filter((seller) => seller.status === "active" && connectedIds.includes(seller.id)).map((seller) => (
                  <option key={seller.id} value={seller.id}>{seller.name} · {seller.location}</option>
                ))}
              </select></label>
              <label>Amount<input required type="number" min="1" step="0.01" value={financeForm.amount} onChange={(event) => setFinanceForm({ ...financeForm, amount: event.target.value })} placeholder="180000" /></label>
              <label>Currency<select value={financeForm.currency} onChange={(event) => setFinanceForm({ ...financeForm, currency: event.target.value as FinanceTransaction["currency"] })}><option>USD</option><option>EUR</option><option>GBP</option></select></label>
              <label>Maturity date<input required type="date" value={financeForm.maturityDate} onChange={(event) => setFinanceForm({ ...financeForm, maturityDate: event.target.value })} /></label>
              <label>Trade reference<input required value={financeForm.reference} onChange={(event) => setFinanceForm({ ...financeForm, reference: event.target.value })} placeholder="RFQ or purchase order number" /></label>
              <label className="field-span-2">Purpose<textarea required value={financeForm.purpose} onChange={(event) => setFinanceForm({ ...financeForm, purpose: event.target.value })} placeholder="Describe the underlying commodity transaction and settlement requirement" /></label>
            </div>
            <div className="rfq-modal-footer">
              <button type="button" className="secondary-action" onClick={() => setShowFinanceModal(false)}>Cancel</button>
              <button type="submit" className="primary-action modal-publish" disabled={!connectedIds.length}><Landmark size={15} /> Submit application</button>
            </div>
          </form>
        </div>
      )}

      {selectedFinance && (
        <div className="modal-backdrop rfq-detail-backdrop" role="dialog" aria-modal="true" aria-label={`Trade transaction ${selectedFinance.id}`}>
          <div className="rfq-detail-modal finance-detail-modal">
            <div className="rfq-modal-header">
              <div><p className="eyebrow">{selectedFinance.id}</p><h2>{selectedFinance.instrument}</h2></div>
              <button onClick={() => setSelectedFinanceId(null)}><X size={18} /></button>
            </div>
            <div className="rfq-detail-body">
              <div className="detail-summary">
                <div><span>Counterparty</span><strong>{selectedFinance.counterparty}</strong></div>
                <div><span>Amount</span><strong>{selectedFinance.currency} {selectedFinance.amount.toLocaleString("en-US")}</strong></div>
                <div><span>Maturity</span><strong>{new Date(`${selectedFinance.maturityDate}T00:00:00`).toLocaleDateString()}</strong></div>
                <div><span>Status</span><strong>{selectedFinance.status}</strong></div>
              </div>
              <div className="finance-detail-section">
                <span>Trade reference</span>
                <strong>{selectedFinance.reference}</strong>
              </div>
              {selectedFinance.counterpartySellerId && (
                <div className="finance-detail-section">
                  <span>Routing</span>
                  <strong>Submitted to verified active seller · {sellers.find((seller) => seller.id === selectedFinance.counterpartySellerId)?.name ?? selectedFinance.counterparty}</strong>
                </div>
              )}
              <div className="finance-detail-section">
                <span>Purpose</span>
                <p>{selectedFinance.purpose}</p>
              </div>
              <div className="finance-document-list">
                <div className="finance-document-heading"><strong>Required documents</strong><span>{selectedFinance.documents.length} attached</span></div>
                {selectedFinance.documents.length ? selectedFinance.documents.map((document) => (
                  <div className="finance-document" key={document}><ShieldCheck size={15} /><span>{document}</span><b>Attached</b></div>
                )) : (
                  <div className="finance-document finance-document-empty"><FileText size={15} /><span>No documents uploaded</span><b>Pending</b></div>
                )}
              </div>
              <div className="finance-detail-actions">
                {selectedFinance.status === "Pending documents" && <button className="secondary-action" onClick={() => updateFinanceStatus(selectedFinance.id, "Under review")}>Complete review request</button>}
                {selectedFinance.status === "Under review" && <button className="secondary-action" onClick={() => updateFinanceStatus(selectedFinance.id, "Pending acceptance")}>Send for acceptance</button>}
                {selectedFinance.status === "Pending acceptance" && <button className="primary-action modal-publish" onClick={() => updateFinanceStatus(selectedFinance.id, "In custody")}>Accept terms</button>}
                {selectedFinance.status === "In custody" && <button className="primary-action modal-publish" onClick={() => updateFinanceStatus(selectedFinance.id, "Settled")}>Mark settled</button>}
                {["Settled", "Declined"].includes(selectedFinance.status) && <button className="secondary-action" onClick={() => openFinanceApplication(selectedFinance.instrument)}>Create related application</button>}
                <button className="secondary-action" onClick={() => setSelectedFinanceId(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRfqModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={editingRfqId ? "Edit RFQ" : "Create RFQ"}>
          <form className="rfq-modal" onSubmit={(event) => saveRfq(event, false)}>
            <div className="rfq-modal-header">
              <div><p className="eyebrow">Commodity sourcing</p><h2>{editingRfqId ? "Edit request" : "Create request for quotation"}</h2></div>
              <button type="button" onClick={() => { setShowRfqModal(false); setEditingRfqId(null); }}><X size={18} /></button>
            </div>
            <div className="rfq-modal-body">
              <label className="field-span-2">Request title<input required value={rfqForm.title} onChange={(event) => setRfqForm({ ...rfqForm, title: event.target.value })} placeholder="e.g. Investment-grade gold bars" /></label>
              <label>Commodity<select value={rfqForm.commodity} onChange={(event) => setRfqForm({ ...rfqForm, commodity: event.target.value as Category })}><option>Gold</option><option>Silver</option><option>Timber Logs</option><option>Precious Metals</option></select></label>
              <label>Specification<input required value={rfqForm.specification} onChange={(event) => setRfqForm({ ...rfqForm, specification: event.target.value })} placeholder="Purity, grade or certification" /></label>
              <label>Quantity<div className="quantity-field"><input required type="number" min="0.01" step="any" value={rfqForm.quantity} onChange={(event) => setRfqForm({ ...rfqForm, quantity: event.target.value })} /><select value={rfqForm.unit} onChange={(event) => setRfqForm({ ...rfqForm, unit: event.target.value })}><option>kg</option><option>tonnes</option><option>oz</option><option>m3</option><option>pieces</option></select></div></label>
              <label>Closing date<input required type="date" value={rfqForm.closingDate} onChange={(event) => setRfqForm({ ...rfqForm, closingDate: event.target.value })} /></label>
              <label>Target delivery<input required type="date" value={rfqForm.targetDelivery} onChange={(event) => setRfqForm({ ...rfqForm, targetDelivery: event.target.value })} /></label>
              <label>Delivery location<input required value={rfqForm.deliveryLocation} onChange={(event) => setRfqForm({ ...rfqForm, deliveryLocation: event.target.value })} placeholder="Port, warehouse or city" /></label>
              <label>Trade term<select value={rfqForm.incoterm} onChange={(event) => setRfqForm({ ...rfqForm, incoterm: event.target.value })}><option>CIF</option><option>FOB</option><option>EXW</option><option>DAP</option><option>DDP</option></select></label>
              <label>Indicative budget<input value={rfqForm.budget} onChange={(event) => setRfqForm({ ...rfqForm, budget: event.target.value })} placeholder="$0.00" /></label>
              <label className="field-span-2">Additional requirements<textarea value={rfqForm.notes} onChange={(event) => setRfqForm({ ...rfqForm, notes: event.target.value })} placeholder="Assay, logistics, documents, insurance or acceptance criteria" /></label>
              <fieldset className="supplier-selection field-span-2">
                <legend>Invite eligible suppliers</legend>
                <div>{sellers.filter((seller) => seller.status === "active" && seller.category === rfqForm.commodity).map((seller) => (
                  <label key={seller.id}><input type="checkbox" checked={rfqForm.supplierIds.includes(seller.id)} onChange={(event) => setRfqForm({ ...rfqForm, supplierIds: event.target.checked ? [...rfqForm.supplierIds, seller.id] : rfqForm.supplierIds.filter((id) => id !== seller.id) })} /><span><strong>{seller.name}</strong><small>{seller.location} · {seller.capacity}</small></span></label>
                ))}</div>
              </fieldset>
            </div>
            <div className="rfq-modal-footer">
              <button type="button" className="secondary-action" onClick={() => { setShowRfqModal(false); setEditingRfqId(null); }}>Cancel</button>
              <button type="submit" className="secondary-action">Save draft</button>
              <button type="button" className="primary-action modal-publish" onClick={(event) => saveRfq(event as unknown as FormEvent, true)}>Publish RFQ</button>
            </div>
          </form>
        </div>
      )}

      {selectedRfq && (
        <div className="modal-backdrop rfq-detail-backdrop" role="dialog" aria-modal="true" aria-label={`RFQ ${selectedRfq.id}`}>
          <div className="rfq-detail-modal">
            <div className="rfq-modal-header">
              <div><p className="eyebrow">{selectedRfq.id}</p><h2>{selectedRfq.title}</h2></div>
              <button onClick={() => setSelectedRfqId(null)}><X size={18} /></button>
            </div>
            <div className="rfq-detail-body">
              <div className="detail-summary">
                <div><span>Commodity</span><strong>{selectedRfq.commodity}</strong></div>
                <div><span>Quantity</span><strong>{selectedRfq.quantity} {selectedRfq.unit}</strong></div>
                <div><span>Trade term</span><strong>{selectedRfq.incoterm}</strong></div>
                <div><span>Closing</span><strong>{new Date(`${selectedRfq.closingDate}T00:00:00`).toLocaleDateString()}</strong></div>
              </div>
              <div className="detail-spec-grid">
                <div><span>Specification</span><strong>{selectedRfq.specification}</strong></div>
                <div><span>Delivery location</span><strong>{selectedRfq.deliveryLocation}</strong></div>
                <div><span>Target delivery</span><strong>{new Date(`${selectedRfq.targetDelivery}T00:00:00`).toLocaleDateString()}</strong></div>
                <div><span>Budget</span><strong>{selectedRfq.budget || "Not disclosed"}</strong></div>
              </div>
              <div className="detail-notes"><span>Requirements</span><p>{selectedRfq.notes || "No additional requirements."}</p></div>
              <div className="quote-section">
                <div className="quote-heading"><h3>Supplier quotes</h3><span>{selectedRfq.quotes.length} received</span></div>
                {selectedRfq.quotes.length ? selectedRfq.quotes.map((quote) => (
                  <div className="quote-row" key={quote.sellerId}>
                    <div><strong>{quote.sellerName}</strong><span>Valid until {quote.validUntil}</span></div>
                    <div><span>Total price</span><strong>{quote.totalPrice}</strong></div>
                    <div><span>Lead time</span><strong>{quote.leadTime}</strong></div>
                    <div><span>{quote.incoterm}</span><b className={`status-pill ${quote.status === "Shortlisted" ? "success" : ""}`}>{quote.status}</b></div>
                    {selectedRfq.status !== "Awarded" && selectedRfq.status !== "Cancelled" && (
                      <div className="quote-actions">
                        <button onClick={() => shortlistQuote(selectedRfq.id, quote.sellerId)}>Shortlist</button>
                        <button className="award-button" onClick={() => awardQuote(selectedRfq.id, quote.sellerId)}>Award</button>
                      </div>
                    )}
                  </div>
                )) : <div className="quote-empty">No quotes have been submitted yet.</div>}
              </div>
            </div>
            <div className="rfq-detail-footer">
              {selectedRfq.status === "Draft" && <button className="primary-action" onClick={() => { updateRfqStatus(selectedRfq.id, "Published"); setSelectedRfqId(null); }}>Publish RFQ</button>}
              {["Draft", "Published"].includes(selectedRfq.status) && <button className="secondary-action" onClick={() => openEditRfq(selectedRfq)}>Edit</button>}
              {selectedRfq.status !== "Cancelled" && selectedRfq.status !== "Closed" && <button className="danger-action" onClick={() => updateRfqStatus(selectedRfq.id, "Cancelled")}>Cancel RFQ</button>}
              {selectedRfq.status === "Cancelled" && <button className="danger-action" onClick={() => deleteRfq(selectedRfq.id)}>Delete record</button>}
            </div>
          </div>
        </div>
      )}

      <button className="chat-launcher" onClick={() => setChatOpen((value) => !value)}>{chatOpen ? <X size={20} /> : <><MessageCircle size={20} /><span>Ask Linkly</span></>}</button>
      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-header"><div className="bot-avatar"><Sparkles size={16} /></div><div><strong>Linkly Assistant</strong><span><i /> Online</span></div><button onClick={() => setChatOpen(false)}><X size={18} /></button></div>
          <div className="chat-messages">{messages.map((message, index) => <div key={index} className={`chat-message ${message.from}`}>{message.text}</div>)}</div>
          <form className="chat-form" onSubmit={sendChat}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Ask about a commodity..." /><button aria-label="Send"><ChevronRight size={18} /></button></form>
        </div>
      )}

      {utilityPanel && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={utilityPanel}>
          <div className={`utility-modal utility-${utilityPanel}`}>
            <button className="modal-close" aria-label="Close" onClick={() => setUtilityPanel(null)}><X size={18} /></button>
            {utilityPanel === "settings" && (
              <>
                <p className="eyebrow">Account preferences</p><h2>Settings</h2>
                <div className="settings-list">
                  <label><span><strong>Marketplace notifications</strong><small>Receive trade and request updates</small></span><input type="checkbox" defaultChecked /></label>
                  <label><span><strong>Weekly summary</strong><small>Receive activity reports by email</small></span><input type="checkbox" defaultChecked /></label>
                  <label><span><strong>Two-factor authentication</strong><small>Recommended for account protection</small></span><input type="checkbox" /></label>
                </div>
              </>
            )}
            {utilityPanel === "notifications" && (
              <>
                <div className="utility-heading"><div><p className="eyebrow">Inbox</p><h2>Notifications</h2></div><button onClick={() => setNotificationsRead(true)}>Mark all read</button></div>
                <div className="notification-list">
                  <button><span className={!notificationsRead ? "unread-dot" : ""} /><div><strong>{portalRole === "seller" ? "New finance request submitted" : "Verified seller matched your criteria"}</strong><small>12 minutes ago</small></div></button>
                  <button><span /><div><strong>{portalRole === "seller" ? "Supplier directory update required" : "New seller offers are available"}</strong><small>Yesterday</small></div></button>
                </div>
              </>
            )}
            {utilityPanel === "profile" && (
              <form className="profile-settings-form" onSubmit={saveProfile}>
                <p className="eyebrow">Account details</p><h2>Profile settings</h2>
                <label>Full name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} /></label>
                <label>Email address<input type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} readOnly={authUser.role === "admin"} /></label>
                {profileError && <div className="auth-error">{profileError}</div>}
                {profileNotice && <div className="profile-notice">{profileNotice}</div>}
                <div className="profile-role"><span>Access role</span><b>{authUser.role === "admin" ? "Marketplace administrator" : authUser.role === "seller" ? "Registered seller" : "Registered buyer"}</b></div>
                <button className="auth-submit" type="submit">Save profile</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showSellerPostModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create seller post">
          <form className="seller-post-modal" onSubmit={submitSellerPost}>
            <div className="seller-post-modal-header">
              <div><p className="eyebrow">Seller marketplace</p><h2>Create a new post</h2></div>
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setShowSellerPostModal(false)}><X size={18} /></button>
            </div>
            <div className="seller-post-modal-body">
              {!sellerSubscriptionActive && <div className="seller-post-limit"><strong>Free tier</strong><span>{Math.max(0, 3 - sellerDailyPostCount)} of 3 posts remaining today</span></div>}
              <label>Commodity<select value={sellerPostCategory} onChange={(event) => setSellerPostCategory(event.target.value as Category)}><option>Gold</option><option>Silver</option><option>Timber Logs</option></select></label>
              <label>Post title<input required value={sellerPostTitle} onChange={(event) => setSellerPostTitle(event.target.value)} placeholder="Investment-grade gold bars" /></label>
              <label>Description<textarea required maxLength={240} value={sellerPostDescription} onChange={(event) => setSellerPostDescription(event.target.value)} placeholder="Describe quality, origin, delivery terms or availability..." /></label>
              <div className="seller-post-two-column">
                <label>Quantity<input required value={sellerPostQuantity} onChange={(event) => setSellerPostQuantity(event.target.value)} placeholder="500" /></label>
                <label>Unit<select value={sellerPostUnit} onChange={(event) => setSellerPostUnit(event.target.value)}><option>kg</option><option>tonnes</option><option>m3</option><option>oz</option></select></label>
              </div>
              <div className="seller-post-two-column">
                <label>Country<input value={sellerPostCountry} onChange={(event) => setSellerPostCountry(event.target.value)} placeholder={authUser?.country || "United Arab Emirates"} /></label>
                <label>Price<input value={sellerPostPrice} onChange={(event) => setSellerPostPrice(event.target.value)} placeholder="Contact for price" /></label>
              </div>
              <label className="seller-post-image-field">Post image
                <input type="file" accept="image/*" onChange={handleSellerPostImage} />
                {sellerPostImage ? <img src={sellerPostImage} alt="Selected post preview" /> : <span><Plus size={16} /> Select an image from your device</span>}
              </label>
            </div>
            <div className="seller-post-modal-footer">
              <button type="button" className="secondary-action" onClick={() => setShowSellerPostModal(false)}>Cancel</button>
              <button type="submit" className="primary-action modal-publish"><Plus size={15} /> Publish post</button>
            </div>
          </form>
        </div>
      )}

      {showInboxUpgrade && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Seller Pro upgrade">
          <div className="pricing-modal seller-pricing-modal">
            <button className="modal-close" onClick={() => setShowInboxUpgrade(false)}><X size={18} /></button>
            <div className="pricing-icon"><Crown size={22} /></div>
            <p className="eyebrow">Seller Pro</p>
            <h2>Upgrade to receive and reply</h2>
            <p className="pricing-copy">Free sellers can see buyer names and message counts. Pro unlocks full inboxes, comment replies and seller-to-seller messaging.</p>
            <div className="price"><strong>$249</strong><span>/ month</span></div>
            <ul><li><Check size={14} /> Read buyer direct messages</li><li><Check size={14} /> Reply on seller posts and comments</li><li><Check size={14} /> Pro seller-to-seller messaging</li><li><Check size={14} /> Cancel or downgrade anytime</li></ul>
            <button className="activate-button" onClick={activateSellerSubscription}>Activate Seller Pro</button>
            <p className="demo-note"><ShieldCheck size={12} /> Demo checkout — no payment is processed</p>
          </div>
        </div>
      )}


      <nav className="mobile-nav">
        {portalRole === "seller" ? (
          <>
            <button className={activeNav === "Seller dashboard" ? "active" : ""} onClick={() => setActiveNav("Seller dashboard")}><ShieldCheck size={20} /><span>Suppliers</span></button>
            <button className={activeNav === "Seller messages" ? "active" : ""} onClick={() => setActiveNav("Seller messages")}><MessageCircle size={20} /><span>Messages</span></button>
            <button className={activeNav === "RFQ queue" ? "active" : ""} onClick={() => setActiveNav("RFQ queue")}><PackageSearch size={20} /><span>RFQs</span></button>
            <button className={activeNav === "Finance requests" ? "active" : ""} onClick={() => setActiveNav("Finance requests")}><CircleDollarSign size={20} /><span>Finance</span></button>
            <button onClick={signOut}><UserRound size={20} /><span>Sign out</span></button>
          </>
        ) : (
          <>
            {navItems.map((item) => { const Icon = item.icon; return <button key={item.label} className={activeNav === item.label ? "active" : ""} onClick={() => navigateMemberSection(item.label)}><Icon size={20} /><span>{item.label}</span></button>; })}
            <button className={["Procurement", "Trade finance", "Compliance"].includes(activeNav) ? "active" : ""} onClick={() => setActiveNav("Procurement")}><UserRound size={20} /><span>Workspace</span></button>
          </>
        )}
      </nav>
    </div>
  );
}
