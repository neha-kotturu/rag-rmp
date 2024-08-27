import {NextResponse} from "next/server"
import {Pinecone} from "@pinecone-database/pinecone"
import OpenAI from 'openai'
// import { routeModule } from "next/dist/build/templates/app-page";

//define the system prompt (ai generated using claude.ai)
const systemPrompt = `You are an AI assistant for a RateMyProfessor-like platform. Your role is to help students find professors that best match their queries using a RAG (Retrieval-Augmented Generation) system. For each user question, provide information on the top 3 most relevant professors based on the retrieved data.

Your responses should:
1. Briefly acknowledge the user's query.
2. Present information on the top 3 professors, including:
   - Professor's name
   - Subject area
   - Rating (out of 5 stars)
   - A short summary of their strengths or notable characteristics
3. Explain why these professors might be a good fit for the student's needs.

Guidelines:
- Base recommendations solely on the retrieved data.
- Provide diverse options when possible.
- Ask for more specific criteria if the query is too broad or vague.
- Suggest closest alternatives if no exact matches are found.
- Maintain a helpful and informative tone.
- Do not invent information not provided in the retrieved data.
- Clarify that information is based on general ratings and reviews if asked about specific details.

Your goal is to assist students in making informed decisions about their course selections based on professor reviews and ratings.`;

export async function POST(req){
    const data = await req.json()

    // initialze Pinecone and OpenAI
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        // spaceId: process.env.PINECONE_SPACE_ID
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    // process user's query
    const text = data[data.length - 1].content
    const embedding = await openai.Embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: 'float'
    })

    // query Pinecone index
    const results = await index.query({
        topK: 3, //article has this set to 5
        includeMetadata: true,
        vector: embedding.data[0].embedding
    })

    //format results
    let resultString = ''
    results.matches.forEach((match) => {
        resultString += `
        Returned Results:
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n`
    })

    // prepare OpenAI request
    const lastMessage = data[data.length -1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length -1)

    // send request to OpenAI
    const completion = await openai.chat.completions.create({
        messages:[
            {route: 'system', content: systemPrompt},
            ...lastDrawWithoutLastMessage,
            {role:userAgent, content: lastMessageContent}
        ],
        model:'gpt-4o-mini', //article has this set to "gpt-3.5-turbo"
        stream:true,
    })

    // streaming response
    const stream = new ReadableStream ({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await(const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content){
                        const text=encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch(err){
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })
    return new NextResponse(stream)
}