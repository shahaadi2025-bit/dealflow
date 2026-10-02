# Curated ticker universes per sector. This is not the full market - free-tier hosting
# can't afford one live API call per ticker across thousands of names - but each list
# covers the sector broadly. For any OTHER company, use the search bar in the app to
# jump straight to its valuation workbench regardless of sector or whether it's listed here.
UNIVERSES = {
    "saas": [
        "CRM","NOW","ADBE","WDAY","HUBS","DDOG","ZS","NET","MDB","TEAM","DOCU","BOX",
        "ASAN","FRSH","GTLB","S","PATH","BILL","TWLO","OKTA","ESTC","CFLT","APPF","PCOR",
        "DT","PAYC","PCTY","BRZE","QLYS","TENB","RPD","VRNS","DBX","NCNO","PD","SEMR",
        "AMPL","DOMO","YEXT","FIVN","WK","ALRM","SPT","ZM","GWRE","MNDY","BL","CWAN",
        "VEEV","CRWD","PANW","FTNT","SNOW","PLTR","U","AI","SMAR","INTA","SSNC","MANH",
        "TYL","BSY","ZUO","EVBG","API","SPSC","UPLD","NEWR","JAMF","FROG","BIGC","WIX",
        "SQSP","SHOP","HCP","EGHT","RNG","FIVE9","NICE","VRSK","ROP","ANSS","CDNS","SNPS",
        "PTC","ADSK","INTU","TTD","APP","DV","IAS","PUBM","CRTO","BRZE","EXFY","GTLB",
        "AVDX","SPT","ZI","GDDY","ZETA","DAVA","VRNT","KLTR","PRO","SVMK","XM","CXM",
        "FORG","ALKT","ENFN","PGY","CIXX","BASE","AMBA","ONTF","PING","SAIL","RBLX",
        "CGNX","PEGA","OTEX","BB","TEAM","SPLK","NUAN","TDC","AZPN","CSGP","MSTR",
    ],
    "fintech": [
        "PYPL","XYZ","AFRM","SOFI","UPST","TOST","FOUR","PAYO","FLYW","MQ","RELY",
        "LC","NU","HOOD","COIN","TREE","ENVA","OPFI","PAGS","STNE","DLO","MELI",
        "ADYEY","WISE.L","GPN","FIS","FI","JKHY","EEFT","WEX","CPAY","EVTC","MTCH",
        "V","MA","AXP","DFS","SYF","ALLY","GS","MS","SCHW","IBKR","VIRT","MKTX",
        "TW","ICE","CME","NDAQ","CBOE","MSCI","SPGI","MCO","FDS","VRSN","EFX",
        "TRU","FICO","JXN","BX","APO","KKR","ARES","OWL","STEP","PROG","OPRT",
        "CACC","WU","EVR","PIPR","LPLA","RJF","AMP","IVZ","TROW","BLK","BEN",
        "NMR","AB","VCTR","HLI","PJT","MC","FUTU","TIGR","UWMC","RKT","COOP",
    ],
    "ev": [
        "TSLA","RIVN","LCID","NIO","XPEV","LI","CHPT","EVGO","BLNK","PSNY","QS","LAZR",
        "ARVL","GOEV","PTRA","NKLA","WKHS","REE","FFIE","MULN","VFS","FSR","GM","F",
        "STLA","TM","HMC","RACE","POAHY","BMWYY","VWAGY","HYMTF","BYDDY","GELYY",
        "ALB","LTHM","SQM","PLL","LAC","MP","SGML","LEU","ENVX","SES","QSI",
        "AEHR","ON","WOLF","ALGM","MBLY","APTV","LEA","BWA","MGA","DAN","LI",
        "ABAT","AMPX","EOSE","STEM","FLNC","NOVA","RUN","ENPH","SEDG","FSLR","CSIQ",
    ],
}

# Broad reference pool of well-known large caps -- not shown in any sector screener,
# used only to widen snapshot fallback coverage so arbitrary ticker searches (via the
# search bar) still resolve to something if a live Yahoo fetch is briefly rate-limited.
REFERENCE_TICKERS = [
    "AAPL","MSFT","GOOGL","GOOG","AMZN","META","NVDA","BRK-B","JPM","JNJ","V","UNH",
    "XOM","WMT","PG","MA","HD","CVX","MRK","ABBV","KO","PEP","COST","AVGO","ORCL",
    "BAC","MCD","ADBE","CSCO","NFLX","CRM","ABT","TMO","ACN","LIN","DHR","VZ","NKE",
    "TXN","NEE","PM","WFC","RTX","UPS","AMD","INTC","IBM","GE","CAT","HON","BA",
    "SBUX","LOW","UNP","QCOM","AMGN","GS","SPGI","ELV","BLK","DE","MDT","ISRG","PLD",
    "T","AMT","SYK","GILD","MMC","LMT","ADI","CI","MO","TJX","SCHW","C","REGN","ZTS",
    "PGR","SO","CB","BSX","ETN","BMY","MU","APD","FI","SHW","DUK","BDX","AON","ITW",
    "CME","EOG","NOC","WM","CL","EQIX","MCK","GD","FDX","SLB","PNC","USB","HUM",
]

def sector_of(ticker: str) -> str:
    t = ticker.upper()
    for s, tickers in UNIVERSES.items():
        if t in tickers:
            return s
    return "saas"