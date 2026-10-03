from app.connectors.udyam import UdyamConnector
from app.connectors.gstn import GSTNConnector
from app.connectors.pan_itd import PANITDConnector
from app.connectors.mca21 import MCA21Connector
from app.connectors.epfo import EPFOConnector
from app.connectors.esic import ESICConnector
from app.connectors.startup_india import StartupIndiaConnector
from app.connectors.nsic import NSICConnector
from app.connectors.digilocker import DigiLockerConnector
from app.connectors.dpiit_mii import DPIITMIIConnector
from app.connectors.bis import BISConnector
from app.connectors.gem_blacklist import GeMBlacklistConnector

ALL_CONNECTORS = [
    UdyamConnector(),
    GSTNConnector(),
    PANITDConnector(),
    MCA21Connector(),
    EPFOConnector(),
    ESICConnector(),
    StartupIndiaConnector(),
    NSICConnector(),
    DigiLockerConnector(),
    DPIITMIIConnector(),
    BISConnector(),
    GeMBlacklistConnector(),
]
