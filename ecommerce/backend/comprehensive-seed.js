const { Product, Category, Review, Order, User } = require('./dist/models/index');
require('dotenv').config();

async function comprehensiveSeed() {
  try {
    console.log('🌱 Starting comprehensive seeding...');
    
    // Check if data already exists
    const productCount = await Product.count();
    const reviewCount = await Review.count();
    const orderCount = await Order.count();
    
    console.log(`Current counts - Products: ${productCount}, Reviews: ${reviewCount}, Orders: ${orderCount}`);
    
    // Create sample users first
    const users = [];
    const userEmails = [
      'john.doe@example.com',
      'jane.smith@example.com', 
      'mike.johnson@example.com',
      'sarah.wilson@example.com',
      'david.brown@example.com',
      'lisa.davis@example.com',
      'tom.miller@example.com',
      'emma.garcia@example.com'
    ];
    
    for (let i = 0; i < userEmails.length; i++) {
      const [user, created] = await User.findOrCreate({
        where: { email: userEmails[i] },
        defaults: {
          firstName: userEmails[i].split('.')[0].charAt(0).toUpperCase() + userEmails[i].split('.')[0].slice(1),
          lastName: userEmails[i].split('.')[1].split('@')[0].charAt(0).toUpperCase() + userEmails[i].split('.')[1].split('@')[0].slice(1),
          email: userEmails[i],
          password: 'password123', // Will be hashed automatically by User model hooks
          isActive: true
        }
      });
      users.push(user);
      if (created) {
        console.log(`Created user: ${user.email}`);
      }
    }
    
    // Create 25 sample products across all categories
    const sampleProducts = [
      // Electronics (Category 1)
      {
        name: 'iPhone 15 Pro Max',
        description: 'Latest iPhone with titanium design, A17 Pro chip, and advanced camera system with 5x telephoto zoom.',
        price: 1199.99,
        salePrice: 1099.99,
        stock: 45,
        sku: 'IPHONE15PROMAX-001',
        categoryId: 1,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android smartphone with S Pen, 200MP camera, and AI-powered features.',
        price: 1299.99,
        stock: 35,
        sku: 'GALAXY-S24U-001',
        categoryId: 1,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'MacBook Pro 16-inch M3',
        description: 'Professional laptop with M3 Pro chip, 18GB RAM, and stunning Liquid Retina XDR display.',
        price: 2499.99,
        stock: 20,
        sku: 'MACBOOK-PRO16-M3',
        categoryId: 1,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise canceling wireless headphones with 30-hour battery life.',
        price: 399.99,
        salePrice: 349.99,
        stock: 60,
        sku: 'SONY-WH1000XM5',
        categoryId: 1,
        images: [],
        isActive: true,
        isFeatured: false
      },
      {
        name: 'iPad Air 5th Generation',
        description: 'Powerful tablet with M1 chip, 10.9-inch Liquid Retina display, and all-day battery life.',
        price: 599.99,
        stock: 40,
        sku: 'IPAD-AIR5-001',
        categoryId: 1,
        images: [],
        isActive: true,
        isFeatured: false
      },
      
      // Clothing & Fashion (Category 2)
      {
        name: 'Levi\'s 501 Original Jeans',
        description: 'Classic straight-fit jeans in vintage stonewash blue. Timeless style and comfort.',
        price: 89.99,
        salePrice: 69.99,
        stock: 120,
        sku: 'LEVIS-501-BLUE',
        categoryId: 2,
        images: [],
        isActive: true,
        isFeatured: false
      },
      {
        name: 'Nike Air Force 1 Sneakers',
        description: 'Iconic basketball shoes with classic white leather upper and Air-Sole unit.',
        price: 110.00,
        stock: 85,
        sku: 'NIKE-AF1-WHITE',
        categoryId: 2,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Adidas Ultraboost 23',
        description: 'Premium running shoes with Boost midsole technology and Primeknit upper.',
        price: 190.00,
        stock: 70,
        sku: 'ADIDAS-UB23-001',
        categoryId: 2,
        images: [],
        isActive: true,
        isFeatured: false
      },
      {
        name: 'Zara Wool Blend Coat',
        description: 'Elegant wool blend coat with lapel collar and front button closure.',
        price: 129.99,
        salePrice: 99.99,
        stock: 45,
        sku: 'ZARA-COAT-WOOL',
        categoryId: 2,
        images: [],
        isActive: true,
        isFeatured: false
      },
      
      // Home & Living (Category 3)
      {
        name: 'IKEA MALM Bed Frame',
        description: 'Modern bed frame with adjustable bed sides and slatted bed base included.',
        price: 199.99,
        stock: 30,
        sku: 'IKEA-MALM-BED',
        categoryId: 3,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Dyson V15 Detect Vacuum',
        description: 'Cordless vacuum with laser dust detection and powerful suction.',
        price: 749.99,
        salePrice: 649.99,
        stock: 25,
        sku: 'DYSON-V15-DETECT',
        categoryId: 3,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Succulent Garden Set',
        description: 'Collection of 12 assorted succulent plants with decorative pots.',
        price: 49.99,
        salePrice: 39.99,
        stock: 80,
        sku: 'SUCCULENT-SET-12',
        categoryId: 3,
        images: [],
        isActive: true,
        isFeatured: false
      },
      {
        name: 'Philips Hue Smart Bulbs',
        description: 'Set of 4 color-changing smart LED bulbs with app control.',
        price: 199.99,
        stock: 55,
        sku: 'PHILIPS-HUE-4PACK',
        categoryId: 3,
        images: [],
        isActive: true,
        isFeatured: false
      },
      
      // Sports & Outdoors (Category 4)
      {
        name: 'Peloton Bike+',
        description: 'Premium indoor cycling bike with rotating HD touchscreen and live classes.',
        price: 2495.00,
        stock: 15,
        sku: 'PELOTON-BIKEPLUS',
        categoryId: 4,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Yeti Rambler Tumbler',
        description: '30oz stainless steel tumbler with MagSlider lid and double-wall insulation.',
        price: 39.99,
        stock: 100,
        sku: 'YETI-RAMBLER-30OZ',
        categoryId: 4,
        images: [],
        isActive: true,
        isFeatured: false
      },
      {
        name: 'REI Co-op Hiking Backpack',
        description: '65L hiking backpack with adjustable torso and multiple compartments.',
        price: 249.99,
        salePrice: 199.99,
        stock: 40,
        sku: 'REI-BACKPACK-65L',
        categoryId: 4,
        images: [],
        isActive: true,
        isFeatured: false
      },
      
      // Books & Media (Category 5)
      {
        name: 'The Seven Husbands of Evelyn Hugo',
        description: 'Captivating novel by Taylor Jenkins Reid about a reclusive Hollywood icon.',
        price: 16.99,
        salePrice: 12.99,
        stock: 150,
        sku: 'BOOK-EVELYN-HUGO',
        categoryId: 5,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Atomic Habits by James Clear',
        description: 'Practical guide to building good habits and breaking bad ones.',
        price: 18.99,
        stock: 200,
        sku: 'BOOK-ATOMIC-HABITS',
        categoryId: 5,
        images: [],
        isActive: true,
        isFeatured: false
      },
      {
        name: 'National Geographic Magazine Subscription',
        description: '12-month subscription to National Geographic magazine.',
        price: 39.99,
        stock: 999,
        sku: 'NATGEO-SUB-12M',
        categoryId: 5,
        images: [],
        isActive: true,
        isFeatured: false
      },
      
      // Health & Beauty (Category 6)
      {
        name: 'Olaplex Hair Treatment Set',
        description: 'Professional hair repair treatment system for damaged hair.',
        price: 89.99,
        salePrice: 74.99,
        stock: 65,
        sku: 'OLAPLEX-TREATMENT',
        categoryId: 6,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Fitbit Charge 6',
        description: 'Advanced fitness tracker with GPS, heart rate monitoring, and 7-day battery.',
        price: 199.99,
        stock: 75,
        sku: 'FITBIT-CHARGE6',
        categoryId: 6,
        images: [],
        isActive: true,
        isFeatured: false
      },
      
      // Toys & Games (Category 7)
      {
        name: 'LEGO Creator Expert Taj Mahal',
        description: 'Detailed LEGO model of the iconic Taj Mahal with 5923 pieces.',
        price: 369.99,
        stock: 20,
        sku: 'LEGO-TAJMAHAL-5923',
        categoryId: 7,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Nintendo Switch OLED',
        description: 'Gaming console with vibrant OLED screen and enhanced audio.',
        price: 349.99,
        stock: 50,
        sku: 'NINTENDO-SWITCH-OLED',
        categoryId: 7,
        images: [],
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Monopoly Classic Board Game',
        description: 'The classic property trading game for family fun.',
        price: 24.99,
        stock: 90,
        sku: 'MONOPOLY-CLASSIC',
        categoryId: 7,
        images: [],
        isActive: true,
        isFeatured: false
      },
      
      // Automotive (Category 8)
      {
        name: 'Tesla Model 3 Floor Mats',
        description: 'All-weather floor mats designed specifically for Tesla Model 3.',
        price: 149.99,
        stock: 35,
        sku: 'TESLA-M3-MATS',
        categoryId: 8,
        images: [],
        isActive: true,
        isFeatured: false
      },
      {
        name: 'Garmin DriveSmart 86',
        description: '8-inch GPS navigator with voice-activated navigation and live traffic.',
        price: 349.99,
        salePrice: 299.99,
        stock: 25,
        sku: 'GARMIN-DS86-GPS',
        categoryId: 8,
        images: [],
        isActive: true,
        isFeatured: false
      }
    ];
    
    // Insert products
    const createdProducts = [];
    for (const productData of sampleProducts) {
      try {
        const [product, created] = await Product.findOrCreate({
          where: { sku: productData.sku },
          defaults: productData
        });
        createdProducts.push(product);
        if (created) {
          console.log(`Created product: ${product.name}`);
        }
      } catch (error) {
        console.error(`Error creating product ${productData.name}:`, error.message);
      }
    }
    
    // Create reviews (at least 10 reviews per product)
    const reviewTexts = [
      'Excellent product! Highly recommend.',
      'Great quality and fast shipping.',
      'Perfect for my needs. Very satisfied.',
      'Good value for money.',
      'Amazing product, exceeded expectations!',
      'Fast delivery and great customer service.',
      'Exactly as described. Very happy.',
      'Outstanding quality and design.',
      'Would definitely buy again.',
      'Fantastic product, love it!',
      'Great build quality and performance.',
      'Impressive features and functionality.',
      'Solid product, works perfectly.',
      'Excellent craftsmanship and attention to detail.',
      'Very pleased with this purchase.',
      'Top-notch quality and service.',
      'Reliable and durable product.',
      'Stylish design and great functionality.',
      'Perfect addition to my collection.',
      'Highly satisfied with the quality.'
    ];
    
    let reviewsCreated = 0;
    for (const product of createdProducts) {
      // Create 10-15 reviews per product
      const numReviews = Math.floor(Math.random() * 6) + 10; // 10-15 reviews
      
      for (let i = 0; i < numReviews; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 star ratings mostly
        const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
        
        try {
          const [review, created] = await Review.findOrCreate({
            where: {
              productId: product.id,
              userId: randomUser.id
            },
            defaults: {
              productId: product.id,
              userId: randomUser.id,
              rating: rating,
              comment: reviewText,
              isApproved: true
            }
          });
          
          if (created) {
            reviewsCreated++;
          }
        } catch (error) {
          // Skip if review already exists for this user-product combination
        }
      }
    }
    
    console.log(`Created ${reviewsCreated} reviews`);
    
    // Create sample orders
    const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    let ordersCreated = 0;
    
    for (let i = 0; i < 15; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProducts = createdProducts.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
      
      let totalAmount = 0;
      const orderItems = [];
      
      for (const product of randomProducts) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = product.salePrice || product.price;
        totalAmount += price * quantity;
        
        orderItems.push({
          productId: product.id,
          quantity: quantity,
          price: price
        });
      }
      
      try {
        const [order, created] = await Order.findOrCreate({
          where: {
            userId: randomUser.id,
            totalAmount: totalAmount
          },
          defaults: {
            userId: randomUser.id,
            status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
            totalAmount: totalAmount,
            shippingAddress: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State 12345`,
            paymentMethod: 'credit_card',
            items: orderItems
          }
        });
        
        if (created) {
          ordersCreated++;
          console.log(`Created order for ${randomUser.email}: $${totalAmount}`);
        }
      } catch (error) {
        console.error(`Error creating order:`, error.message);
      }
    }
    
    // Final counts
    const finalProductCount = await Product.count();
    const finalReviewCount = await Review.count();
    const finalOrderCount = await Order.count();
    
    console.log('\n✅ Comprehensive seeding completed!');
    console.log(`📊 Final counts:`);
    console.log(`   Products: ${finalProductCount}`);
    console.log(`   Reviews: ${finalReviewCount}`);
    console.log(`   Orders: ${finalOrderCount}`);
    console.log(`   Users: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in comprehensive seeding:', error);
    process.exit(1);
  }
}

comprehensiveSeed();