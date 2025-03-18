
/*
In this part of my code, I am creating an aynschronous function which will deal with the communication
between my API endpoints and the AFS API endpoints. My endpoints only need information from the AFS or will
write information to the AFS, hence only GET and POST HTTP methods will be handled. In the case of a GET, we 
append the visitors query parameters to the AFS url and use fetch to retrieve information based on the AFS' api
response. For a POST, we add our body of data that we want to add to the AFS in our options object and run fetch.

HELP OF CHATGPT OPENAI: Understand how to use fetch in GET or POST scenarios and understand how to pass a key in the header.
*/
export async function apiClient(endpoint, method = "GET", filters= {}){
    const url = new URL (`${process.env.AFS_URL}${endpoint}`);
    
    let options = {
        method: method,
        headers: {
                "x-api-key" : process.env.AFS_KEY,
                "Content-Type": "application/json"
        }
    }

    if(method === "GET"){
        Object.keys(filters).forEach(filt => url.searchParams.append(filt, filters[filt]));   
    } else{
        options.body = JSON.stringify(filters);
    }
    
    
    const response = await fetch(url, options);




    if(!response.ok){
        const error = await response.json();
        return new Response(JSON.stringify({ error: error.message || "Error while fetching from AFS" }), {
            status: response.status,
            headers: { "Content-Type": "application/json" }
        });
    }
    return response.json(); 
    
}



