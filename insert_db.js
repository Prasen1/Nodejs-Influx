/* dependent packages and files required */
import fetch from 'node-fetch';
import log from './utils/logger.js';
import { get_token } from './auth_handler.js';
import config from './config/config_catchpoint.js';
import config_influx from './config/config_influx.js';
import { InfluxDB } from '@influxdata/influxdb-client';
import { convert } from 'json-to-line-protocol';

/* 

functions:
        Function Name                   Description
    fetch_Data            :     function to fetch data from LastRaw API
    convert_data          :     function to convert JSON from LastRaw API to Line Protocol
    write_data            :     function to write lines of data into influxDB
    get_token             :     function to get Access token 

*/

// Global Variable
const raw_data_url = `${config.base_url}${config.last_raw_path}`;
const client_key = config.client_key;
const client_secret = config.client_secret;
const token = config_influx.token;
const org = config_influx.organization;
const bucket = config_influx.bucket;
const db_url = config_influx.url;
const measurement = config_influx.measurement_name;
const test_types = config.tests;

// main function to fetch and store data
async function run() {
    try {
        let token = await get_token(client_key, client_secret);
        var tests_list = [];
        // breakdown the tests list into chunks of 50 test ids for each test type
        Object.keys(test_types).forEach(function (key, index) {
            var temp = [], chunk = 50;
            for (let i = 0, j = test_types[key].length; i < j; i += chunk) {
                temp.push(test_types[key].slice(i, i + chunk));
            }
            tests_list.push(temp);
        });
        for (let tests of tests_list) {
            for (let arr of tests) {
                var url = raw_data_url + arr;
                let raw_data = await fetch_Data(token, url);
                let json_line = convert_data(raw_data);
                if (json_line != "No Data") {
                    write_data(json_line);
                }
                else {
                    log.info("No Data for the last 15 minutes");
                }
            }
        }
    }
    catch (err) {
        let error = new Error(err);
        log.error(error);
    }
}

// function to fetch Raw Data
function fetch_Data(token, url) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            headers: {
                'accept': 'application/json',
                'authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(json => {
                // if object has property Message ,display Error, else Process Data
                if (json.hasOwnProperty('Message')) {
                    log.error(`${json.Message}`);
                    reject(json.Message)
                } else {
                    log.info("<<Fetched Raw Test Data>>", url, "Raw Data Start Timestamp: " + json.start + " End Timestamp: " + json.end)
                    if (json.hasOwnProperty('error')) {
                        log.error(`${json.error}`, "<<Check Catchpoint configuration file>>")
                    }
                    resolve(json)
                }

            }).catch(err => {
                log.error(err)
                reject(err)
            }
            );
    });
}
// function to parse and convert JSON to influx lines
function convert_data(structure) {
    // Checks if there is test data for the last 15 mins
    if (structure['detail'] != null) {

        var items = []
        var test_params = []
        var test_metric_values = []
        var temp = {}
        var solution = {}
        var lines = []

        for (let value of structure['detail']['fields']['synthetic_metrics']) {
            var metrics = value['name']
            test_params.push(metrics)
        }

        for (let value of structure['detail']['items']) {
            var metric_values = value['synthetic_metrics']
            var flag = true
            var temp = {}
            temp.breakdown_tags = {}
            temp.data_timestamp = {}
            for (let i in value) {
                if (i != 'synthetic_metrics') {
                    if (i == 'dimension') {
                        temp.data_timestamp = value[i]['name']
                    }
                    if (i == 'breakdown_1') {
                        temp.breakdown_tags[i] = value[i]['name']
                    }
                    if (i == 'breakdown_2') {
                        temp.breakdown_tags[i] = value[i]['name']
                    }
                    if (i == 'hop_number') {
                        temp.breakdown_tags[i] = value[i]
                    }
                    if (i == 'step') {
                        temp.breakdown_tags[i] = value[i]
                    }
                }
            }
            if (flag == true) {
                metric_values.push(temp)
                test_metric_values.push(metric_values)
            }
        }
        for (let test_metric_value of test_metric_values) {
            temp = {}
            temp.fields = {}
            for (let i = 0; i < test_metric_value.length; i++) {
                if (typeof (test_metric_value[i]) != "object")
                    temp.fields[test_params[i]] = test_metric_value[i]
                else
                    for (let value in test_metric_value[i]) {
                        temp[value] = test_metric_value[i][value]
                    }
            }
            items.push(temp)
        }
        solution['items'] = items

        log.info("<<#Items:>>", solution.items.length)
        // Converts objects to an array of lines
        for (let item of solution['items']) {
            let line = convert({
                measurement: measurement,
                tags: item['breakdown_tags'],
                //Convert the ISO date to epoch nanosecond timestamp for InfluxDb
                ts: new Date(item['data_timestamp']).getTime() * 1000000,
                fields: item['fields']
            })
            lines.push(line)
        }
        console.log(lines) //cronjob will store the lines written to influx in /logs/cronlog.log during last run
        return lines;
    }
    else {
        log.info(structure)
        return ("No Data");
    }
}

//function to write lines of data to InfluxDB 
function write_data(lines) {
    log.info("<<#Lines passed to Write function>>", lines.length);
    const client = new InfluxDB({ url: db_url, token: token })
    const writeApi = client.getWriteApi(org, bucket)
    writeApi.writeRecords(lines)
    writeApi
        .close()
        .then(() => {
            console.log('FINISHED')
            log.info("<<Finished writing data>>")
        })
        .catch(e => {
            console.error(e)
            console.log('\\nFinished ERROR')
            log.error("!!Error encountered while writing data", e)
        })
}
//Run the main function
//var interval=setInterval(run,900000)
run();

export {
    convert_data,
    fetch_Data,
    write_data
}