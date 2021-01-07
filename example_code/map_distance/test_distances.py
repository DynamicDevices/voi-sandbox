from Postcode import Postcode, Distance

# set a couple of postcodes
# these are sanity checked for valid form as well as existence (force errors to see for yourself)
# existence test uses a postcodes.io API
p1 = Postcode("EH66SH")
p2 = Postcode("W1A1AA")

# create a Distance object
# this sets the source and destination locations to p1 & p2 Postcodes
# and calculates a distance (by road) between them using a project-osrm.org API
d = Distance(p1,p2)
print(d)

# change the destination location for the Distance object by assigning a new Postcode to it
d.dest = Postcode("ZE1 0GT")
# this AUTOMATICALLY re-calculates the distance so you can just print the new distance
print(d)
