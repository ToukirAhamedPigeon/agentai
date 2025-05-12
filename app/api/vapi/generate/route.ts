import {generateText} from "ai";
import {google} from "@ai-sdk/google"

export async function POST(request: Request){
    const {type, role, level, techstack, amount, userId } = await request.json();

    try {
        const { text } = await generateText({
            model: google('gemini-2.0-flash-001'),
            prompt: 'Prepare questions for a job interview ...'
        })
    } catch (error) {
        console.log(error);
        return Response.json({success:false, error}, {status:500});
    }
}

export async function GET(){
    return Response.json({success:true, data:'THANK YOU'}, {status:200});
}