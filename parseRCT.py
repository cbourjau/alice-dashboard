#!/bin/python
from bs4 import BeautifulSoup
from math import *
import csv

def MakeRowList(row):
    runNumber = row.contents[1].string
    bunches = row.contents[3].string

    fillingScheme = row.contents[5].string
    field = row.contents[47].string
    ac0 = row.contents[49].string
    ad0 = row.contents[51].string
    emc = row.contents[53].string
    fmd = row.contents[55].string
    hlt = row.contents[57].string
    hmp = row.contents[59].string
    mch = row.contents[61].string
    mtr = row.contents[63].string
    phs = row.contents[65].string
    pmd = row.contents[67].string
    spd = row.contents[69].string
    sdd = row.contents[71].string
    ssd = row.contents[73].string
    tof = row.contents[75].string
    tpc = row.contents[77].string
    trd = row.contents[79].string
    t0 = row.contents[81].string
    v0 = row.contents[83].string
    zdc = row.contents[85].string
    hltMode = row.contents[87].string

    return [runNumber,bunches,fillingScheme,field,ac0,ad0,emc,fmd,hlt,hmp,mch,mtr,phs,pmd,spd,sdd,ssd,tof,tpc,trd,t0,v0,zdc,hltMode]

def MakeRowListIter(row):
    counter = 0
    outList = []
    for child in row.children :
        if((counter % 2) == 1) : # skipping "empty" rows
            if((counter == 9 or counter == 11 or counter == 38)) :
                value = int(child.string.replace(',',''))
            else :
                value = child.string
            outList.append(value)
        counter += 1

    return outList


# ==============================================================================
fOutput = open("RCT.csv","wb")


print "####### Testing the SOUP #########"

soup = BeautifulSoup(open("alimonitor.html"), "lxml")
#print(soup.prettify())

row = soup.find("tr",class_="table_row_right")

#print "======= Row ======="
#print row
#print soup.find_all("tr",class_="table_row_right",limit=10)


print "======= Contents ======="
print "All entries: %d"%len(row.contents)
print row.contents
print "======= rowrens ======="

# iteration over data in row (corresponding to run)
# used to listing all rowren in given run
counter = 0
counterUsable = 0
for row in row.children :
    if((counter % 2) == 1) : # skipping "empty" rows
        counterUsable += 1
        print " --- row %d --------------"%counter
        print "  type: %s"%type(row)
        print "  string: %s"%row.string
        print "  value: %s"%row
    counter += 1

print "=======\n Usable rowrens: %d (out of all %d)  ======="%(counterUsable,counter)

# defining writer for CSV output
writer = csv.writer(fOutput)

rows = soup.find_all("tr",class_="table_row_right",limit=100)
for singleRow in rows :
    rowList = MakeRowListIter(singleRow)
    writer.writerow(rowList)




# runNumber = row.contents[1].string
# fillingScheme = row.contents[5].string
# field = row.contents[47].string
# ac0 = row.contents[49].string
# ad0 = row.contents[51].string
# emc = row.contents[53].string
# fmd = row.contents[55].string
# hlt = row.contents[57].string
# hmp = row.contents[59].string
# mch = row.contents[61].string
# mtr = row.contents[63].string
# phs = row.contents[65].string
# pmd = row.contents[67].string
# spd = row.contents[69].string
# sdd = row.contents[71].string
# ssd = row.contents[73].string
# tof = row.contents[75].string
# tpc = row.contents[77].string
# trd = row.contents[79].string
# t0 = row.contents[81].string
# v0 = row.contents[83].string
# zdc = row.contents[85].string
#
# hltMode = row.contents[87].string
# #print type(runNumber)
# #print runNumber.string
# #print unicode(runNumber)
#
# #print "%s / %s / %s"%(runNumber,fillingScheme,hltMode)
#
# rowList = [runNumber,fillingScheme,field,ac0,ad0,emc,fmd,hlt,hmp,mch,mtr,phs,pmd,spd,sdd,ssd,tof,tpc,trd,t0,v0,zdc,hltMode]
#
# # defining writer for CSV output
# writer = csv.writer(fOutput)
# writer.writerow(rowList)
# #writer.writerow([runNumber.string])
