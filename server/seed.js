const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY

);
const fsuMerch = [
  { name: "Bobcat Pride Hoodie", description: "Heavyweight red fleece with the classic FSU paw print.", price: 45.00, stock: 50, image_url: "https://placehold.co/400x400?text=FSU+Hoodie", category: "Apparel" },
  { name: "Frostburg Alumni Tee", description: "Vintage charcoal grey cotton with gold lettering.", price: 22.50, stock: 100, image_url: "https://placehold.co/400x400?text=Alumni+Tee", category: "Apparel" },
  { name: "Campus Skyline Poster", description: "18x24 print featuring the Clock Tower and Lane Center.", price: 15.00, stock: 30, image_url: "https://placehold.co/400x400?text=Campus+Poster", category: "Decor" },
  { name: "Bobcat Gold Water Bottle", description: "Insulated stainless steel, keeps drinks cold for 24 hours.", price: 28.00, stock: 45, image_url: "https://placehold.co/400x400?text=FSU+Bottle", category: "Accessories" },
  { name: "FSU Knit Beanie", description: "Perfect for those cold Frostburg winters. One size fits all.", price: 18.00, stock: 60, image_url: "https://placehold.co/400x400?text=Knit+Beanie", category: "Apparel" },
  { name: "Computer Science Dept Mug", description: "Matte black ceramic mug for late-night coding sessions.", price: 12.00, stock: 25, image_url: "https://placehold.co/400x400?text=CS+Mug", category: "Accessories" },
  { name: "Bobcat Mascot Plush", description: "Soft 10-inch plush mascot wearing a miniature FSU jersey.", price: 20.00, stock: 15, image_url: "https://placehold.co/400x400?text=Plush+Mascot", category: "Gifts" },
  { name: "State of Maryland FSU Decal", description: "Vinyl sticker for laptops or car windows.", price: 5.50, stock: 200, image_url: "https://placehold.co/400x400?text=FSU+Decal", category: "Accessories" },
  { name: "Frostburg Varsity Jacket", description: "Premium leather sleeves with wool body and embroidered patches.", price: 120.00, stock: 5, image_url: "https://placehold.co/400x400?text=Varsity+Jacket", category: "Apparel" },
  { name: "Lane Center Canvas Tote", description: "Eco-friendly reusable bag for books or groceries.", price: 14.99, stock: 40, image_url: "https://placehold.co/400x400?text=FSU+Tote", category: "Gifts" }
];

async function seed(){
    console.log("Cleaning out old products...");

    const { error: delError} = await supabase.from('products').delete().neq('id',0);
    if (delError)
 console.error("error clearing table:", delError);

console.log("Seeding 10 products...")
const { data, error } = await supabase.from('products').insert(fsuMerch);

if (error) {
    console.error("Error seeding data:", error.message);

}else{
    console.log( "Sucessfully seeded 10 products into Supabase");
}
}

seed();