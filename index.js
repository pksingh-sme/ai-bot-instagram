import dotenv from 'dotenv';
import axios from 'axios';
import puppeteer from 'puppeteer';
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
  
  

// Load environment variables from .env file
const { ACCESS_TOKEN, IG_USER_ID } = process.env;

// Function to publish a post
async function publishInstagramPost(imageUrl, caption) {
    try {
        // Step 1: Upload the photo to Instagram
        const uploadUrl = `https://graph.facebook.com/v17.0/${IG_USER_ID}/media`;
        const uploadResponse = await axios.post(uploadUrl, {
            image_url: imageUrl,
            caption: caption,
            access_token: ACCESS_TOKEN
        });

        if (!uploadResponse.data.id) {
            throw new Error('Failed to upload media.');
        }

        const containerId = uploadResponse.data.id;

        // Step 2: Publish the uploaded media
        const publishUrl = `https://graph.facebook.com/v17.0/${IG_USER_ID}/media_publish`;
        const publishResponse = await axios.post(publishUrl, {
            creation_id: containerId,
            access_token: ACCESS_TOKEN
        });

        if (publishResponse.data.id) {
            console.log('Post published successfully! Post ID:', publishResponse.data.id);
        } else {
            throw new Error('Failed to publish post.');
        }
    } catch (error) {
        console.error('Error publishing post:', error.message);
    }
}


async function generateAIText(prompt) {
    const response = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt: prompt,
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });
  

    return response.choices[0]?.text || "";

}

// Generate Image using OpenAI
async function generateImage(prompt) {
    try {
      const response = await openai.images.generate({
        model: 'dall-e-2',
        prompt: prompt,
        quality: 'standard',
        n: 1, // Number of images to generate
        size: '1024x1024', // Image size
      });
  
      const imageUrl = response.data[0].url;
      console.log('Generated image URL:', imageUrl);
      return imageUrl;
  
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  
}

async function scrapeDynamicDiv (url, divSelector) {
    try {
        // Launch Puppeteer with the new Headless mode
        const browser = await puppeteer.launch({
            headless: "new" // Explicitly opt into the new Headless mode
        });

        const page = await browser.newPage();

        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Wait for the div to be rendered
        await page.waitForSelector(divSelector);

        // Extract the text content of the div
        const divContent = await page.$eval(divSelector, (div) => div.textContent.trim());

        //console.log(`Content of ${divSelector}:`, divContent);

        // Close the browser
        await browser.close();

        return divContent;
    } catch (error) {
        console.error('Error scraping dynamic div:', error.message);
    }
}




// Main Function to Run the Workflow
async function main() {

    // Example usage
    const url = 'https://www.iplt20.com/match/2024/1452';
    const divSelector = '.ppText.ng-binding.ng-scope';
    const matchInformation = await scrapeDynamicDiv(url, divSelector);
    const jsonInstruction = 'Ensure the JSON is accurate, concise, and formatted as follows:{ "MatchHighlights": "Summary of the match...", "Teams": "Team 1 vs Team 2", "Winner": "Winning team name", "StarPerformances": "Details of standout players and their contributions.", "QuirkyMoment": "A fun or unusual event that occurred during the match."}';

    const promptSummary = "From the detailed match commentary and analysis provided below, generate a JSON with the following fields:\nMatchHighlights: A summary of the match, including the result, the main turning points, and key moments that defined the game.\nTeams: The names of the teams that played in the match.\nWinner: The name of the winning team.\nStarPerformances: Key player contributions, including batting, bowling, and the Player of the Match with their impact on the game.\nQuirkyMoment: A unique or humorous moment from the match that stood out or added to the drama.\nUse the details provided below to derive this information:\n\n---MATCH DETAILS---\n\n'" + matchInformation +"'"+jsonInstruction;

    const matchSummaryJSON = await generateAIText(promptSummary);



    const promptCaption = "Create a catchy caption for Instagram in Meme Style based on the following details in JSON format: ---JSON STRING---'"+matchSummaryJSON+"' --- Keep the tone light, fun, and engaging. Include up to 3 hashtags and emojis to match the vibe.";

    const matchCaption = await generateAIText(promptCaption);

    const promptInputImage = "Provide me a prompt to Create Instagram visuals inspired by modern meme aesthetics image based on: ---JSON STRING--- '"+matchSummaryJSON+"'. Focus on humor, bold imagery, and capturing key cricket moments without adding text to the image and limit the prompt to max 700 chars.";
    const promptImage = await generateAIText(promptInputImage);


    //const promptImage = "Create Instagram visuals inspired by modern meme aesthetics based on: ---JSON STRING--- '"+matchSummaryJSON+"'. Focus on humor, bold imagery, and capturing key cricket moments without adding text to the image.";
 
   const imageUrl = await generateImage(promptImage);

   await publishInstagramPost(imageUrl, matchCaption);

   
    console.log(imageUrl);
}

// Run Main Function
main().catch(console.error);
