# Ticker universes per sector. Delisted/acquired names are skipped automatically at fetch time.
UNIVERSES = {
    "saas": ["CRM", "NOW", "ADBE", "WDAY", "HUBS", "DDOG", "ZS", "NET", "MDB", "TEAM", "DOCU", "BOX",
             "ASAN", "FRSH", "GTLB", "S", "PATH", "BILL", "TWLO", "OKTA", "ESTC", "CFLT", "APPF", "PCOR",
             "DT", "PAYC", "PCTY", "BRZE", "QLYS", "TENB", "RPD", "VRNS", "DBX", "NCNO", "PD", "SEMR",
             "AMPL", "DOMO", "YEXT", "FIVN", "WK", "ALRM", "SPT", "ZM", "GWRE", "MNDY", "BL", "CWAN"],
    "fintech": ["PYPL", "XYZ", "AFRM", "SOFI", "UPST", "TOST", "FOUR", "PAYO", "FLYW", "MQ", "RELY",
                "LC", "NU", "HOOD", "COIN", "TREE", "ENVA", "OPFI", "PAGS", "STNE", "DLO"],
    "ev": ["TSLA", "RIVN", "LCID", "NIO", "XPEV", "LI", "CHPT", "EVGO", "BLNK", "PSNY", "QS", "LAZR", "REE"],
}

def sector_of(ticker: str) -> str:
    for s, tickers in UNIVERSES.items():
        if ticker.upper() in tickers:
            return s
    return "saas"
