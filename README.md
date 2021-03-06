# Nodejs-Influx
Catchpoint Integration with InfluxDB
---
InfluxDB is a high-performance time series database which can store hundreds of thousands of data points per second. This integration relies on a NodeJS/Python script that runs every 15 minutes to pull raw synthetic test performance data from Catchpoint's REST API and store it in InfluxDB. Once the data has been ingested, it can be viewed and analyzed using any compatible analytics tool (e.g. Grafana). 

**Note: Right now, it has ability to pull data from one division per script setup**

## Prerequisites
1. NodeJS v16.x
2. [InfluxDB v2.x](https://docs.influxdata.com/influxdb/v2.1/install/?t=Linux)
3. Catchpoint account with a REST API consumer

## Installation and Configuration
1. Copy the Nodejs-Influx folder to your machine
2. Run npm install in the directory /Nodejs-Influx

### Configuration
1. In the config_catchpoint.js file under config sub-directory, enter your [Catchpoint API consumer key and secret](https://portal.catchpoint.com/ui/Content/Administration/ApiDetail.aspx)
2. In the tests object of the config_catchpoint.js file, enter the Test IDs you want to pull the data for in an array format. Please ensure to enter only the Test ID in the array belonging to the respective Test Type.

*Example:*

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
3. In the config_influx.js file, enter your [Influx API token](https://docs.influxdata.com/influxdb/cloud/security/tokens/create-token/)
4. In the same config_influx.js file, enter your InfluxDB organization name, bucket name, url and measurement name where the data will be stored. Note that the organization and bucket should be created after installation of InfluxDB. The default Influx URL is http://localhost:8086

## How to run
- In the /Nodejs-Influx directory, run `node insert_db.js` after uncommenting the `var interval=setInterval(run,900000)` and commenting out the `run()` line in the same file

**or**

- Create a cronjob to run the insert_db.js script every 15 minutes.

*Example crontab entry, if the file resides in /usr/local/bin/insert_db.js*

`*/15 * * * * cd /usr/local/bin/ && node /usr/local/bin/insert_db.js > /usr/local/bin/logs/cronlog.log 2>&1`

**Note: Ensure that influx service is running**

## File Structure

    Nodejs-Influx/
    ????????? auth_handler.js       ## Contains APIs related to authentication       
    ????????? config
    | ????????? config_catchpoint.js## Configuration file for Catchpoint 
    | ????????? config_influx.js    ## Configuration file for InfluxDB 
    ????????? logs
    | ????????? info
    | |  ????????? info.log         ## Contains informational logs. File name will be based on date of execution
    | ????????? error
    | |  ????????? error.log        ## Contains error logs. File name will be based on date of execution          
    ????????? utils
    | ????????? logger.js           ## logger utility
    ?????????package.json           ## project dependencies
    ????????? insert_db.js          ## main file


Once the script starts running and data is inserted into InfluxDB, it can queried using [Flux queries](https://docs.influxdata.com/influxdb/v2.1/query-data/execute-queries/influx-api/) or visualized in graphs by opening the [Influx Data Explorer](https://docs.influxdata.com/influxdb/cloud/query-data/execute-queries/data-explorer/). 

