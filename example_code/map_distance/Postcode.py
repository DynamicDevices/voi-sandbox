import re
import requests
from geopy.distance import geodesic
import pprint

class Distance:

    _endpoint    = "https://router.project-osrm.org/route/v1/driving"
    _source      = None
    _destination = None
    _distance    = None


    def __init__(self, source, destination):
        self.source    = source
        self.dest      = destination


    def __str__(self):
        str  = "[SOURCE LOCATION]\n"
        str += f"{self.source}\n"
        str += "[DESTINATION LOCATION]\n"
        str += f"{self.dest}\n"
        str += f"DISTANCE = {self.distance}\n"
        return str


    def __calculate(self):
        loc_a = f"{self.source.lon},{self.source.lat}"
        loc_b = f"{self.dest.lon},{self.dest.lat}"

        try:
            response = requests.get(f"{self._endpoint}/{loc_a};{loc_b}")
        except requests.ConnectionError as e:
            print("Route Lookup Connection Error. Check internet connection.\n")
            print(str(e))
        except requests.Timeout as e:
            print("Route Lookup Timeout Error. Try increasing timeout.\n")
            print(str(e))
        except requests.RequestException as e:
            print("Route Lookup General Error.\n")
            print(str(e))

        if response.status_code == 200:
            data = response.json()
            conv_fact = 0.621371 # kms -> miles conversion factor
            self._distance = f"{data['routes'][0]['distance']/1000:.2f}"
        elif response.status_code == 404:
            raise LookupError(f"Route lookup has returned no data.")


    @property
    def source(self): return self._source

    @source.setter
    def source(self, postcode):
        if isinstance(postcode, Postcode):
            self._source = postcode
            # if destination location is known, auto-calculate distance
            if self.dest is not None:
                self.__calculate()
        else:
            raise TypeError ("source is not a Postcode instance")

    @property
    def dest(self): return self._destination

    @dest.setter
    def dest(self, postcode):
        if isinstance(postcode, Postcode):
            self._destination = postcode
            # if source location is known, auto-calculate distance
            if self.source is not None:
                self.__calculate()
        else:
            raise TypeError ("destination is not a Postcode instance")

    @property
    def distance(self): return self._distance



class Postcode:

    _endpoint         = "https://api.postcodes.io/postcodes"
    _postcode_pattern = "^\s*([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|GIR ?0A{2})\s*$"

    _postcode         = None
    _timeout          = None
    _valid            = False
    _exists           = False
    _latitude         = None
    _longitude        = None
    _admin_district   = None
    _country          = None

    def __init__(self, postcode, timeout=5):
        self.postcode          = postcode.upper()
        self._timeout          = timeout


    def __str__(self):
        str  = f"postcode        : {self.postcode}\n"
        str += f"latitude        : {self.lat}\n"
        str += f"longitude       : {self.lon}\n"
        str += f"admin district  : {self._admin_district}\n"
        str += f"country         : {self._country}\n"
        return str


    @property
    def valid(self): return self._valid

    @property
    def exists(self): return self._exists


    @property
    def lat(self): return self._latitude

    @property
    def lon(self): return self._longitude


    @property
    def postcode(self): return self._postcode

    @postcode.setter
    def postcode(self, postcode):
        if re.search(self._postcode_pattern, postcode):
            self._valid = True
            self._postcode = postcode
            self.__lookup()
        else:
            raise ValueError(f"'{postcode}' is not a valid postcode.")


    def __lookup(self):
        address = f"{self._endpoint}/{self.postcode}"
        try:
            response = requests.get(address, timeout=self._timeout)
        except requests.ConnectionError as e:
            print("Postcode Lookup Connection Error. Check internet connection.\n")
            print(str(e))
        except requests.Timeout as e:
            print("Postcode Lookup Timeout Error. Try increasing timeout.\n")
            print(str(e))
        except requests.RequestException as e:
            print("Postcode Lookup General Error.\n")
            print(str(e))

        if response.status_code == 200:
            self._exists = True
            data = response.json()
            self._latitude        = data['result']['latitude']
            self._longitude       = data['result']['longitude']
            self._admin_district  = data['result']['admin_district']
            self._country         = data['result']['country']
        elif response.status_code == 404:
            raise LookupError(f"Postcode lookup for {self.postcode} has returned no data")
