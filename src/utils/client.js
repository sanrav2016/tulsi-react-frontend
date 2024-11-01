import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
    projectId: '3zeldxq2',
    dataset: 'production',
    apiVersion: '2021-11-16',
    useCdn: false,
    token: process.env.REACT_APP_SANITY_TOKEN
})

export const cdnClient = createClient({
    projectId: '3zeldxq2',
    dataset: 'production',
    apiVersion: '2021-11-16',
    useCdn: true,
    token: process.env.REACT_APP_SANITY_TOKEN
})

const builder = imageUrlBuilder(client)

export const urlFor = (source) => builder.image(source)