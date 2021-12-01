# Nodejs-Influx
Catchpoint Integration with InfluxDB
---
## Introduction
---
InfluxDB works really well with observability tools like Grafana and more. We can use this integration to pull timeseries data from Catchpoint and store it in influxDB so that we can plot similar dashboards as Catchpoint.

### Prerequisites
---
1. NodeJS v16.x
2. [InfluxDB v2.x](https://docs.influxdata.com/influxdb/v2.1/install/?t=Linux)
3. Catchpoint account with a REST API consumer

## Installation and Configuration
---
1. Copy the Nodejs-Influx folder to your machine
2. Run npm install in the directory /Nodejs-Influx

### - Configuration
- In the config.js file under config sub-directory, enter your [Catchpoint API consumer key and secret](https://portal.catchpoint.com/ui/Content/Administration/ApiDetail.aspx)
- In the tests object of the config.js file, enter the test IDs you want to pull the data for in array format. 
*Example*
---
    tests: 
    {
        web: [142613,142614,142615,142616],
        transaction: [142602,142603],
        api: [142683,142689,155444],
        ping: [142600],
        traceroute: [142607,142608,142609],
        dns: [942639,142640,142641],
        websocket: [842700],
        smtp: [142604]
    }

---
- In the config_influx.js file, enter your [Influx API token](https://docs.influxdata.com/influxdb/cloud/security/tokens/create-token/)
- In the same config_influx.js file, enter your InfluxDB organization name, bucket name, url and measurement name where the data will be stored. Please note that the organization and bucket should be created after installation of InfluxDB. The default Influx URL is http://localhost:8086

### How to run
- In the /Nodejs-Influx directory, run node insert_db.js after uncommenting the `var interval=setInterval(run,900000)` line in the same file
or
- Create a cronjob to run the insert_db.js script every 15 minutes
**Please ensure that influx service is running**


