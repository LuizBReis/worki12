const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReviews() {
  console.log('🔍 Verificando avaliações no banco...\n');

  // Buscar todas as avaliações de freelancer
  const freelancerReviews = await prisma.freelancerReview.findMany({
    include: {
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
      recipient: { select: { id: true, firstName: true, lastName: true, email: true } }
    }
  });

  console.log('📋 FREELANCER REVIEWS:');
  freelancerReviews.forEach((review, index) => {
    console.log(`${index + 1}. ID: ${review.id}`);
    console.log(`   Rating: ${review.rating}`);
    console.log(`   Comment: ${review.comment}`);
    console.log(`   Author: ${review.author.firstName} ${review.author.lastName} (${review.author.email})`);
    console.log(`   Recipient: ${review.recipient.firstName} ${review.recipient.lastName} (${review.recipient.email})`);
    console.log(`   RecipientId: ${review.recipientId}`);
    console.log(`   Created: ${review.createdAt}\n`);
  });

  // Buscar todas as avaliações de cliente
  const clientReviews = await prisma.clientReview.findMany({
    include: {
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
      recipient: { select: { id: true, firstName: true, lastName: true, email: true } }
    }
  });

  console.log('📋 CLIENT REVIEWS:');
  clientReviews.forEach((review, index) => {
    console.log(`${index + 1}. ID: ${review.id}`);
    console.log(`   Rating: ${review.rating}`);
    console.log(`   Comment: ${review.comment}`);
    console.log(`   Author: ${review.author.firstName} ${review.author.lastName} (${review.author.email})`);
    console.log(`   Recipient: ${review.recipient.firstName} ${review.recipient.lastName} (${review.recipient.email})`);
    console.log(`   RecipientId: ${review.recipientId}`);
    console.log(`   Created: ${review.createdAt}\n`);
  });

  // Testar agregação manualmente
  const freelancerId = 'cmh4d825g0000t3rwl7v8vuxr';
  console.log(`🧮 Testando agregação para freelancer ${freelancerId}:`);
  
  const freelancerAgg = await prisma.freelancerReview.aggregate({
    where: { recipientId: freelancerId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  
  console.log('Agregação freelancer:', freelancerAgg);
  
  const freelancerReviewsForUser = await prisma.freelancerReview.findMany({
    where: { recipientId: freelancerId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  
  console.log('Reviews para o freelancer:', freelancerReviewsForUser);

  await prisma.$disconnect();
}

checkReviews().catch(console.error);