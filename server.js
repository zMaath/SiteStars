const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
    const { url, public_id } = req.body;
    
    if (url) {
        const filePath = path.join(__dirname, "players", `${public_id}.png`);

        try {
            const response = await axios({
                url,
                responseType: "stream",
            });

            response.data.pipe(fs.createWriteStream(filePath));

            console.log(`Imagem salva: ${filePath}`);
            res.status(200).send("Imagem salva com sucesso.");
        } catch (error) {
            console.error("Erro ao baixar imagem:", error);
            res.status(500).send("Erro ao baixar imagem.");
        }
    } else {
        res.status(400).send("Nenhuma URL fornecida.");
    }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));