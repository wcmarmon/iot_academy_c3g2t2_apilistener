/**
 * Main entry point for the data fetching and storing application.
 * 
 * This script sets up a connection to a PostgreSQL database, creates a table if it does not exist,
 * fetches data from an API, and inserts the data into the database.
 * 
 * The script uses the `axios` library to make HTTP requests to the API and the `pg` library to interact with the database.
 * 
 * The main function, `main`, orchestrates the data fetching and storing process. It creates the table, sets up an interval to fetch data from the API, and inserts the data into the database.
 * 
 * @author [IOT Academy Cohort 3 Group 2 Team 2](https://github.com/IOT-Academy-Cohort-3-Group-2)
 * @version 1.0
 */
import axios from 'axios';
import { Pool } from 'pg';

// Database connection setup
const dbConfig = {
    host: '192.168.0.211',
    port: 3306,
    database: 'academy27',
    user: 'postgres',
    password: 'academy2024!'
};

const pool = new Pool(dbConfig);

/**
 * Creates the 'robot_data' table in the database if it does not exist.
 *
 * This asynchronous function executes a CREATE TABLE query to create the 'robot_data' table
 * with the given columns. If the table already exists, the function does nothing.
 *
 * The function logs a success message if the table is created successfully and an error message
 * if there is an error.
 */
async function createTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS robot_data (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP NOT NULL,
            organization VARCHAR(255),
            division VARCHAR(255),
            plant VARCHAR(255),
            line VARCHAR(255),
            workstation VARCHAR(255),
            type VARCHAR(255),
            tag VARCHAR(255),
            positionx FLOAT,
            positiony FLOAT,
            positionz FLOAT,
            initialized BOOLEAN,
            running BOOLEAN,
            wsviolation BOOLEAN,
            paused BOOLEAN,
            speedpercentage INT,
            finishedpartnum INT,
            m1_torque FLOAT,
            m2_torque FLOAT,
            m3_torque FLOAT,
            m4_torque FLOAT
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log('Table created or already exists.');
    } catch (err) {
        console.error('Error creating table:', err);
    }
}

/**
 * Fetches data from the given API URL
 * 
 * @param apiUrl the URL of the API to fetch data from
 * @returns a JSON object containing the data fetched from the API, or an empty array if there is an error
 */
async function fetchData(apiUrl: string) {
    try {
        const response = await axios.get(apiUrl);
        // return the JSON response
        return response.data;
    } catch (err) {
        console.error(`Error fetching data from ${apiUrl}:`, err);
        // return an empty array if there is an error
        return [];
    }
}

/**
 * Inserts data into the 'robot_data' table in the database.
 * 
 * This asynchronous function takes an array of data objects, each representing a datapoint
 * with various properties such as timestamp, organization, division, plant, line, workstation,
 * type, tag, position coordinates, system states, and motor torques. It constructs an INSERT 
 * SQL query and executes it for each data object, inserting the respective values into the 
 * 'robot_data' table.
 * 
 * The function handles parsing of certain fields such as position coordinates and torques to 
 * floats, and boolean states from strings. It logs a message upon successful insertion of 
 * each record and logs an error message if an insertion fails.
 * 
 * @param data - An array of data objects containing fields to be inserted into the table.
 */
async function insertData(data: any[]) {
    const insertQuery = `
        INSERT INTO robot_data (
            timestamp, organization, division, plant, line, workstation, type, tag,
            positionx, positiony, positionz, initialized, running, wsviolation, paused,
            speedpercentage, finishedpartnum, m1_torque, m2_torque, m3_torque, m4_torque
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21
        );
    `;
    for (const item of data) {
        try {
            await pool.query(insertQuery, [
                item.timestamp,
                item.organization,
                item.division,
                item.plant,
                item.line,
                item.workstation,
                item.type,
                item.tag,
                parseFloat(item.positionx),
                parseFloat(item.positiony),
                parseFloat(item.positionz),
                item.initialized === 'true',
                item.running === 'true',
                item.wsviolation === 'true',
                item.paused === 'true',
                parseInt(item.speedpercentage),
                parseInt(item.finishedpartnum),
                parseFloat(item.m1_torque),
                parseFloat(item.m2_torque),
                parseFloat(item.m3_torque),
                parseFloat(item.m4_torque)
            ]);
            console.log(`Record for ${item.timestamp} inserted into db.`)
        } catch (err) {
            console.error('Error inserting data:', err);
        }
    }
}

/**
 * Main function that orchestrates the data fetching and storing process.
 * 
 * This asynchronous function first ensures that the 'robot_data' table
 * exists in the database by calling `createTable`. It then sets up an 
 * interval to periodically fetch data from a specified API endpoint 
 * and insert the received data into the database.
 * 
 * The function fetches data every 10 seconds from the API URL defined 
 * in `apiUrl`. If data is successfully fetched, it is inserted into 
 * the database using `insertData`. If no data is received, a message 
 * is logged indicating the absence of data.
 */
async function main() {
    const apiUrl = 'http://192.168.0.135:3000/filter/academy34';

    await createTable();

    setInterval(async () => {
        const data = await fetchData(apiUrl);
        if (data.length > 0) {
            await insertData(data);
        } else {
            console.log('No data received from API.');
        }
    }, 10000); // 30 seconds interval
}

main().catch(err => console.error('Error in main function:', err));
