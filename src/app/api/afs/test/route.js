import {saveAirports, saveCities} from "../../../../utils/saveCity_Airports";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/*
This is an endpoint to simply test if both my following functions create a list of cities and airports in the database. */
export async function GET(req) {
    const cities = await saveCities();
    const airports  = await saveAirports();

    return airports;
}