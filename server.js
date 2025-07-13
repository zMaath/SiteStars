const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const fs = require("fs");
const path = require("path");

cloudinary.config({
    cloud_name: 'drxkjmcqx',
    api_key: '835598171251887',
    api_secret: 'Y9nEvGTwOb4WLfTzGx0MW2l9BIM',
});

async function baixarImagens(nextCursor = null) {
    try {
        const options = { max_results: 500 };
        if (nextCursor) options.next_cursor = nextCursor;

        const { resources, next_cursor } = await cloudinary.api.resources(options);

        for (const resource of resources) {
            const filePath = path.join(__dirname, "public", "players", `${resource.display_name}.png`);

            if (!fs.existsSync(filePath)) {
                const response = await axios({
                    url: resource.secure_url,
                    responseType: "stream",
                });

                response.data.pipe(fs.createWriteStream(filePath));
            }
        }

        if (next_cursor) {
            await baixarImagens(next_cursor);
        }

    } catch (error) {
        console.error("Erro ao sincronizar imagens:", error);
    }
}

baixarImagens();