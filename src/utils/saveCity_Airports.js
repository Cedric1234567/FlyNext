#!/usr/bin/env node

/*
This is the file containing our saveCities and saveAirports methods, which allow use to initialize a list
of both in our database, when running our startup scripts. Both utilize the helper function apiClient.

HELP FROM CHATGPT OPENAI: Used to help me modify the airports response from the AFS into a format where each
airport also has a cityId allowing it to reference to a City in our database when create an airport in the Airport
relation.
*/

const { apiClient } = require("../utils/apiClient2");
const { PrismaClient } = require("@prisma/client");
//import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function saveCities(){
    try{
        
        const cities = await apiClient('/api/cities',"GET",{});
        const mod_cities = cities.map(city => ({name: city.city, country: city.country}));
        
        await prisma.City.createMany({
            data: mod_cities, 
        }); 
        return new Response(JSON.stringify("Cities created in database succesfully"), {status: 200}); 
    } catch(error){
        return new Response(JSON.stringify("Error while saving the cities"), {status: 500});
    }
}

async function saveAirports(){
    try{
        const airports = await apiClient('/api/airports', "GET",{});
        const mod_airports = await Promise.all(airports.map(async (airport)=>{
            const city = await prisma.City.findUnique({
                where:{
                    name_country: {
                            name: airport.city, 
                            country: airport.country
                        }
                    }
            });
            return {
                Aid: airport.id,
                code: airport.code,
                name: airport.name,
                cityId: city.id,
                country: airport.country
            };
        }));
        await prisma.Airport.createMany({
            data: mod_airports,
            
        });
        return new Response(JSON.stringify("Airports created in database succesfully"), {status: 200}); 
    } catch(error){
        return new Response(JSON.stringify("Error while saving the airports"), {status: 500});
    }
}

// Export functions to be used in startup.sh
module.exports = { saveCities, saveAirports };