import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import os
os.environ.setdefault("SWR", "0")  # tests expect synchronous live-then-snapshot behaviour; test_perf opts in explicitly
