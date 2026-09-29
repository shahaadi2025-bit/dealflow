# Curated ticker universes per sector. This is not the full market -- free-tier hosting
# can't afford one live API call per ticker across thousands of names -- but each list
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

def sector_of(ticker: str) -> str:
    t = ticker.upper()
    for s, tickers in UNIVERSES.items():
        if t in tickers:
            return s
    return "saas"