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
    "healthcare": [
        "UNH","JNJ","LLY","ABBV","MRK","TMO","ABT","DHR","PFE","BMY","AMGN","GILD",
        "ISRG","VRTX","REGN","MDT","SYK","BSX","ZTS","HCA","CI","ELV","CVS","HUM",
        "CNC","MOH","DXCM","IDXX","IQV","A","MTD","WST","RMD","ALGN","PODD","TECH",
        "BIO","CRL","INCY","UTHR","JAZZ","HOLX","COO","BAX","EW","GEHC","SOLV","ZBH",
        "DOCS","TDOC","HIMS","OSCR","GH","NTRA","EXAS","CRBU","RXRX","DNA","BEAM",
        "NVAX","MRNA","BNTX","CRSP","NTLA","EDIT","VRNA","ALNY","SRPT","BMRN",
    ],
    "cyber": [
        "CRWD","PANW","FTNT","ZS","S","OKTA","CYBR","TENB","RPD","QLYS","VRNS","NET",
        "CHKP","FFIV","JNPR","AKAM","DDOG","SPLK","VRNT","MNDT","SAIL","PING","FORG",
        "SCWX","VRSN","GEN","NLOK","KD","OSPN","AVPT","ESTC","MIME","BB","TENB",
        "RBRK","ZSCALER","SNYK","TUFN","INPX","FEYE","CACI","LDOS","BAH","SAIC",
    ],
    "cloud_infra": [
        "MSFT","AMZN","GOOGL","ORCL","IBM","CSCO","DELL","HPE","NTAP","PSTG","ANET",
        "SMCI","VRT","DT","NEWR","ESTC","MDB","SNOW","CFLT","GTLB","HUBS","DBX","BOX",
        "FSLY","AKAM","NET","TWLO","ZM","RNG","EGHT","FIVN","DOCN","DOMO","PD","FROG",
        "WDC","STX","CIEN","COMM","INFN","NOK","ERIC","AMD","NVDA","MU","QCOM",
    ],
    "consumer": [
        "AMZN","WMT","COST","HD","TJX","LOW","TGT","ROST","DG","DLTR","BBY","ULTA",
        "ORLY","AZO","TSCO","LULU","NKE","DECK","CROX","ONON","SKX","BIRD","YETI",
        "ETSY","CHWY","W","CVNA","CPNG","MELI","SE","BABA","JD","PDD","CHDN","CZR",
        "RCL","CCL","NCLH","MAR","HLT","H","ABNB","BKNG","EXPE","TRIP","DASH","UBER",
        "LYFT","GRUB","CAKE","CMG","SBUX","YUM","DPZ","WING","SHAK","TXRH","DRI",
    ],
    "media": [
        "DIS","NFLX","WBD","PARA","CMCSA","FOXA","LYV","SPOT","EA","TTWO",
        "ATVI","RBLX","MTCH","PINS","SNAP","META","GOOGL","TTD","ROKU","FUBO","CHTR",
        "LBRDA","SIRI","IHRT","NYT","NWSA","OMC","IPG","WPP","PUBM","MGNI","DV","IAS",
        "CRTO","APP","U","SCPL","CNK","AMC","IMAX","LGF-A","MSGE","MSGS","WWE","TKO",
    ],
    "semis": [
        "NVDA","AVGO","AMD","QCOM","TXN","INTC","AMAT","LRCX","KLAC","ADI","MU",
        "MRVL","NXPI","MCHP","ON","SWKS","QRVO","MPWR","TER","ENTG","ASML","TSM",
        "UMC","ARM","SMCI","WOLF","AEHR","ALGM","CRUS","DIOD","LSCC","POWI","SITM",
        "SYNA","FORM","ONTO","UCTT","AMKR","COHU","ICHR","CEVA","AXTI","RMBS",
    ],
    "real_estate": [
        "PLD","AMT","EQIX","PSA","O","WELL","SPG","DLR","CCI","VICI","EXR","AVB",
        "EQR","MAA","INVH","ESS","UDR","CPT","SUI","ELS","ARE","BXP","VTR","PEAK",
        "HST","REG","KIM","FRT","MAC","SKT","CUBE","LSI","NSA","IRM","CSGP","Z",
        "ZG","RDFN","OPEN","COMP","EXPI","RMAX","RLGY","JLL","CBRE","CWK",
    ],
    "industrials": [
        "GE","HON","UNP","RTX","CAT","DE","LMT","BA","UPS","ETN","ITW","EMR",
        "PH","CMI","ROK","CARR","OTIS","PCAR","FAST","PAYX","WM","RSG","XYL",
        "AME","DOV","IEX","SWK","FTV","IR","GWW","NDSN","PNR","FLS","CFX",
        "TT","JCI","LII","ALLE","AOS","MAS","BLDR","OC","VMC","MLM","EXP",
    ],
    "energy": [
        "XOM","CVX","COP","EOG","SLB","MPC","PSX","VLO","WMB","OKE","KMI","OXY",
        "PXD","DVN","HES","FANG","BKR","HAL","TRGP","CTRA","EQT","APA","MRO",
        "NOV","FTI","RRC","AR","SM","MTDR","CHRD","PR","CIVI","OVV","NEE","DUK",
        "SO","D","AEP","EXC","XEL","ED","PEG","WEC","ES","FE","AEE","CMS","PPL",
    ],
    "aerospace_defense": [
        "LMT","RTX","BA","NOC","GD","LHX","TDG","HWM","HEI","TXT","AXON","LDOS",
        "SAIC","BAH","CACI","KTOS","AVAV","MRCY","CW","WWD","MOG-A","ATRO","SPR",
        "HXL","PKE","DCO","RGR","SWBI","OSIS","VSEC","ERJ",
    ],
    "telecom": [
        "T","VZ","TMUS","CMCSA","CHTR","LUMN","VOD","TU","BCE","TEF","ORAN",
        "AMX","TIGO","LBRDA","LBRDK","WBD","DISH","USM","ATEX","SHEN","CCOI",
        "IRDM","GSAT","VSAT","GOGO","ANET","JNPR","CIEN","NOK","ERIC","INFN",
    ],
}


# ---- Extra sectors (v2). Dead/renamed tickers are pruned automatically by build_snapshot. ----
_EXTRA_SECTORS = {
    "renewables": [
        "ENPH","SEDG","FSLR","RUN","ARRY","SHLS","PLUG","BE","FLNC","CSIQ","EOSE","ENVX",
        "STEM","CWEN","BLDP","NEE","NXT","ORA","AES","BEPC","CEG","VST","TLN","OKLO",
        "NNE","SMR",
    ],
    "financials": [
        "JPM","BAC","WFC","C","GS","MS","USB","PNC","TFC","SCHW","BLK","BX",
        "KKR","APO","ARES","OWL","TROW","BEN","IVZ","AMP","RJF","LPLA","IBKR","ICE",
        "CME","NDAQ","CBOE","MCO","SPGI","MSCI","FDS","MKTX","VIRT","JXN","ALLY","SYF",
        "COF","AXP","FITB","RF","KEY","HBAN","MTB","CFG","NTRS","STT","BK",
    ],
    "logistics": [
        "UPS","FDX","UNP","CSX","NSC","ODFL","JBHT","CHRW","EXPD","XPO","SAIA","KNX",
        "LSTR","GXO","ZIM","MATX","DAL","UAL","LUV","AAL","ALK","RXO","WERN","HTLD",
        "ARCB","SNDR","R","URI",
    ],
    "ecommerce": [
        "AMZN","WMT","COST","TGT","HD","LOW","TJX","ROST","DG","DLTR","BBY","ULTA",
        "ETSY","EBAY","CHWY","W","CPNG","MELI","SE","JD","PDD","BABA","SHOP","WSM",
        "RH","LULU","CVNA","OPEN","Z","ZG","RMAX","GLBE","JMIA","VIPS","LI","GRAB",
        "BKNG",
    ],
    "medtech": [
        "ISRG","SYK","BSX","MDT","EW","ZBH","BDX","DXCM","PODD","ABT","RMD","ALGN",
        "TFX","STE","COO","IDXX","GEHC","BAX","TECH","MTD","WST","IQV","CRL","DHR",
        "TMO","A","NTRA","GH","TDOC","HIMS","PEN","GMED","INSP","TMDX","NVST","LIVN",
    ],
    "biotech": [
        "VRTX","REGN","GILD","AMGN","MRNA","BNTX","ALNY","INCY","BMRN","SRPT","NTLA","CRSP",
        "BEAM","EDIT","UTHR","JAZZ","NBIX","EXEL","RXRX","NVAX","DNA","CRBU","ABBV","BMY",
        "PFE","LLY","MRK","JNJ","ARGX","BBIO","IONS","HALO","ACAD","VKTX","MDGL","CYTK",
    ],
    "materials": [
        "LIN","APD","SHW","ECL","DD","DOW","LYB","NUE","STLD","FCX","NEM","SCCO",
        "ALB","LAC","MP","SQM","MLM","VMC","CF","MOS","CTVA","LEU","OC","BLDR",
        "PPG","RPM","IFF","EMN","AVY","BALL","PKG","IP","AA","X","CLF","RS",
    ],
    "travel": [
        "BKNG","ABNB","EXPE","MAR","HLT","H","RCL","CCL","NCLH","LVS","WYNN","MGM",
        "CZR","TRIP","CHDN","LYV","VFS","SAIL","HST","DKNG","PENN","VAC","TNL","WH",
        "CUK",
    ],
    "staples": [
        "KO","PEP","MDLZ","GIS","KHC","HSY","CPB","SJM","CAG","HRL","MKC","STZ",
        "TAP","MNST","KDP","CELH","PG","CL","KMB","CHD","CLX","MO","PM","SOLV",
        "KR","SYY","ADM","BG","TSN","POST","FLO","LW",
    ],
    "insurance": [
        "CB","PGR","TRV","AIG","MET","PRU","ALL","AFL","HIG","CINF","L","WRB",
        "AJG","AON","BRO","ERIE","KNSL","RLI","ACGL","EG","LMND","ROOT","HCI","GL",
        "PFG","LNC","UNM","RGA","AIZ","SIGI",
    ],
    "utilities": [
        "NEE","DUK","SO","D","AEP","EXC","XEL","ED","PEG","WEC","ES","EIX",
        "PCG","SRE","DTE","ETR","FE","PPL","CMS","AEE","CNP","ATO","NI","LNT",
        "EVRG","PNW","OGE","NRG","AWK",
    ],
    "autos": [
        "F","GM","TSLA","STLA","TM","HMC","RACE","APTV","BWA","LEA","MGA","ALV",
        "GNTX","AN","KMX","LAD","PAG","GPC","ORLY","AZO","AAP","HOG","PII","THO",
        "WGO","LKQ",
    ],
    "gaming": [
        "EA","TTWO","RBLX","U","DKNG","PENN","CZR","MGM","LNW","NTES","SE","SONY",
        "CRSR","LOGI","GME","PLTK","SRAD","GENI","RSI",
    ],
    "edtech": [
        "DUOL","COUR","CHGG","UDMY","LRN","PRDO","LOPE","STRA","ATGE","GHC","LAUR","APEI",
        "EDU",
    ],
    "agriculture": [
        "DE","CTVA","CF","MOS","FMC","ADM","BG","TSN","CALM","AGCO","CNHI","NTR",
        "TTC","LNN","AVD","FDP",
    ],
}
for _k, _v in _EXTRA_SECTORS.items():
    UNIVERSES.setdefault(_k, _v)

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