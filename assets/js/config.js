/**
 * AiFang Studio 2.0 - 究極全量設定檔 (Verified: 31 Items)
 */
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbxrmloTY4wCo1Sn5tgMQDRwhU8uXWBTA0c6v17ec7M6W5LkufjES1fjJBolMb_552z5/exec", // [4.2]

    BRAND: {
        NAME: "AiFang Studio",           
        COMPANY_FULL_NAME: "璦坊童裝",   // [6.3]
        TAX_ID: "95294390",              // [6.3]
        EMAIL: "aifangkids@gmail.com",   // [6.1]
        SERVICE_HOURS: "Mon-Fri 09:00-18:00", // [6.1]
        LOGO_IMG: "images/LOGO.png",     // [1.1]
        LINE_ID: "@844bwwjl",            
        LINE_URL: "https://line.me/R/ti/p/@844bwwjl" // [4.3], [5.4]
    },

    MARKETING: {
        SHIPPING_FEE: 60,              // [4.7]
        FREE_SHIPPING_THRESHOLD: 1500, // [4.7]
        COMBO_DISCOUNT: 100,           // [3.6], [4.1]
        
        PAYMENT_METHODS: {             // [4.6]
            "bank_transfer": {
                name: "匯款",
                discountRate: 0.8,     // 20% OFF
                freeShipping: true,    // 匯款免運
                note: "享 8 折優惠 + 免運費"
            },
            "cod": {
                name: "貨到付款",
                discountRate: 0.9,     // 10% OFF
                freeShipping: false,
                note: "享 9 折優惠 (滿$1500免運)"
            }
        }
    },

    NAVIGATION: {
        CART_ICON_EMPTY: "images/cart2.png", // [1.3]
        CART_ICON_FULL: "images/cart3.png",  // [1.3]
        MAIN_CATEGORIES: [                   // [1.4]
            { key: "all", label: "All Products" },
            { key: "Top", label: "Top" },
            { key: "Bottoms", label: "Bottoms" },
            { key: "Set", label: "Set" },
            { key: "Outer", label: "Outer" },
            { key: "Accessories", label: "Accessories" },
            { key: "Family", label: "Family" }
        ],
        BRANDS_FILTER: ["BELLOT", "POISSON", "VIVID-I"] // [1.4]
    },

    UI_STYLE: {
        SIZE_BTN_COLORS: {               // [3.3]
            BEBE: "#FFB5B5",
            KIDS: "#5572FE",
            JUNIOR: "#4CAF50"
        },
        SKELETON_BG: "#F8F8F8",          // [5.1]
        SCROLL_TO_TOP_THRESHOLD: 300,    // [5.4]
        HEADER_TRANSPARENT_TRIGGER: "100vh" // [1.2]
    },
    
    LABELS: {
        SOLD_OUT: "SOLD OUT",            // [2.4]
        DISCOUNT_TAG: "-10% OFF"         // [2.4]
    }
};
Object.freeze(CONFIG);