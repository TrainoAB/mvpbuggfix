import s3Client from '@/app/api/aws/connect';
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { urls } = await req.json(); // Parse the JSON request body
        
        // Check if 'urls' is a valid non-empty array
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return jsonError("Invalid request: 'urls' must be a non-empty array", 400);
        }
        
        // Process each URL and fetch the metadata
        const results = await Promise.all(
            urls.map(async (url) => {
                try {
                    const { bucketName, objectKey } = parseS3Url(url);
                    
                    const command = new HeadObjectCommand({ Bucket: bucketName, Key: objectKey });
                    const response = await s3Client.send(command);
                    
                    // Return the result with a formatted upload date
                    return {
                        url,
                        uploadDate: formatDate(response.LastModified),
                    };
                } catch (error) {
                    console.error(`Error fetching metadata for ${url}:`, error);
                    return { url, error: "Failed to retrieve upload date" };
                }
            })
        );
        
        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return jsonError("Failed to retrieve upload dates", 500);
    }
}

// Helper function to parse S3 URL and extract bucket name and key
function parseS3Url(url) {
    // This pattern extracts the bucket name and the object key from the S3 URL
    const urlPattern = /^https:\/\/([^\.]+)\.s3\.amazonaws\.com\/(.+)/;
    const match = url.match(urlPattern);
    
    if (!match) {
        return jsonError("Invalid S3 URL format", 400); // Return JSON error for invalid URL format
    }
    
    const bucketName = match[1]; // The bucket name
    const objectKey = decodeURIComponent(match[2]); // The object key (after decoding)
    
    // Check if both bucketName and objectKey are valid
    if (!bucketName || !objectKey) {
        return jsonError("Missing bucket name or object key", 400);
    }
    
    return { bucketName, objectKey };
}

// Helper function to format the date into YYYY-MM-DD format
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(d.getDate()).padStart(2, '0'); // Day is 1-based
    
    return `${year}-${month}-${day}`;
}

// Helper function to return a JSON error with a specific message and status
function jsonError(message, status) {
    return NextResponse.json({ error: message }, { status });
}