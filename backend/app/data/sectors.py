"""Sector metadata: display label, one-line blurb, and news search keywords.

The frontend mirrors this in src/lib/sectors.ts (generated from this file), and the
backend exposes it at /sectors/meta.
"""
SECTOR_META: dict[str, dict] = {
    "saas": {"label": "SaaS", "blurb": "Subscription software and platforms", "q": "SaaS OR \"software company\" OR \"cloud software\""},
    "fintech": {"label": "Fintech", "blurb": "Payments, lending and financial software", "q": "fintech OR payments OR \"digital bank\""},
    "ev": {"label": "Electric Vehicles", "blurb": "EV makers, batteries and charging", "q": "\"electric vehicle\" OR EV OR \"EV battery\" OR \"EV charging\""},
    "healthcare": {"label": "Healthcare", "blurb": "Providers, pharma and health services", "q": "healthcare OR pharma OR \"health services\" OR hospital"},
    "cyber": {"label": "Cybersecurity", "blurb": "Security software and services", "q": "cybersecurity OR \"security software\" OR \"cyber security\""},
    "cloud_infra": {"label": "Cloud Infra", "blurb": "Data centers, hosting and dev infrastructure", "q": "\"data center\" OR \"cloud infrastructure\" OR hosting"},
    "consumer": {"label": "Consumer", "blurb": "Retail, restaurants and consumer brands", "q": "retailer OR restaurant OR \"consumer brand\""},
    "media": {"label": "Media", "blurb": "Streaming, publishing and advertising", "q": "streaming OR media OR broadcaster OR advertising"},
    "semis": {"label": "Semiconductors", "blurb": "Chips, equipment and design", "q": "semiconductor OR chipmaker OR \"chip equipment\""},
    "real_estate": {"label": "Real Estate", "blurb": "REITs and property services", "q": "REIT OR \"real estate\" OR \"property portfolio\""},
    "industrials": {"label": "Industrials", "blurb": "Machinery, automation and building products", "q": "industrial OR manufacturer OR machinery OR automation"},
    "energy": {"label": "Energy", "blurb": "Oil, gas, midstream and services", "q": "oil OR gas OR midstream OR \"oilfield services\" OR shale"},
    "aerospace_defense": {"label": "Aerospace & Defense", "blurb": "Primes, suppliers and defense tech", "q": "defense OR aerospace OR \"defense contractor\""},
    "telecom": {"label": "Telecom", "blurb": "Carriers, towers and satellite", "q": "telecom OR wireless OR broadband OR satellite"},
    "renewables": {"label": "Renewables", "blurb": "Solar, storage, hydrogen and clean power", "q": "solar OR \"energy storage\" OR hydrogen OR \"clean energy\" OR nuclear"},
    "financials": {"label": "Financials", "blurb": "Banks, brokers, exchanges and asset managers", "q": "bank OR \"asset manager\" OR brokerage OR exchange"},
    "logistics": {"label": "Logistics & Transport", "blurb": "Freight, rail, airlines and delivery", "q": "logistics OR freight OR trucking OR railroad OR airline"},
    "ecommerce": {"label": "E-commerce & Retail", "blurb": "Online marketplaces and big-box retail", "q": "e-commerce OR marketplace OR \"online retailer\""},
    "medtech": {"label": "MedTech", "blurb": "Devices, diagnostics and life-science tools", "q": "\"medical device\" OR medtech OR diagnostics OR \"life sciences tools\""},
    "biotech": {"label": "Biotech", "blurb": "Drug developers and gene editing", "q": "biotech OR \"drug developer\" OR \"gene therapy\" OR biopharma"},
    "materials": {"label": "Materials & Mining", "blurb": "Chemicals, metals, mining and building materials", "q": "mining OR chemicals OR lithium OR steel OR \"building materials\""},
    "travel": {"label": "Travel & Leisure", "blurb": "Hotels, cruise, casinos and booking", "q": "hotel OR cruise OR casino OR \"online travel\" OR resort"},
    "staples": {"label": "Consumer Staples", "blurb": "Food, beverage and household products", "q": "\"consumer staples\" OR \"packaged food\" OR beverage OR \"household products\""},
    "insurance": {"label": "Insurance", "blurb": "P&C, life and reinsurance", "q": "insurer OR insurance OR reinsurance OR underwriter"},
    "utilities": {"label": "Utilities", "blurb": "Regulated power, gas and water", "q": "utility OR \"electric utility\" OR \"power grid\" OR \"water utility\""},
    "autos": {"label": "Autos & Parts", "blurb": "Automakers, suppliers and dealers", "q": "automaker OR \"auto parts\" OR \"car dealer\" OR \"auto supplier\""},
    "gaming": {"label": "Gaming", "blurb": "Video games, esports and betting", "q": "\"video game\" OR gaming OR esports OR \"sports betting\""},
    "edtech": {"label": "Education", "blurb": "Online learning and for-profit education", "q": "edtech OR \"online learning\" OR \"for-profit education\" OR university"},
    "agriculture": {"label": "Agriculture", "blurb": "Crop inputs, grain and farm equipment", "q": "agriculture OR fertilizer OR grain OR \"farm equipment\""},
}
