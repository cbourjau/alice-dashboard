# ALICE-dashboard
A dashboard for run-by-run statistics of the ALICE detector at CERN. This project was created by Kunal Garg, Vojtech Pacik, Jacopo Margutti,
 Cristina Bedda, and me during a small Hackathon at the March 2017 AICE week.
You can see it in action at https://cbourjau.github.io/alice-dashboard/

# Development
## Parsing raw data to `csv` files
This project pulls in data from various sources and compiles it into a single run-by-run `csv` file. 

## Front end
The fron end is base off a great tutorial by Eamonn Maguire ([link](https://thor-project.github.io/dashboard-tutorial/)).
All the front end related files live under the `docs` folder from where they are served to the github page.
Local development can be done using pythons build in http server:

```bash
git clone git@github.com:cbourjau/alice-dashboard.git
cd alice-dashboard/docs
python -m python -m SimpleHTTPServer
```
