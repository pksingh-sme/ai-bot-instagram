const axios = require('axios');
require('dotenv').config();

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

// Example Usage
const imageUrl = 'https://pksinghalld.wordpress.com/wp-content/uploads/2023/02/93b5658b-285a-4f95-87b1-8371b244e482.jpeg'; // Replace with a valid image URL
const caption = 'Exploring the Spiritual and Cultural Heritage of Varanasi! 🚀'; // Your caption here

publishInstagramPost(imageUrl, caption);
