const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        freelancerProfile: true,
        clientProfile: true,
        freelancerReviewsReceived: true,
        clientReviewsReceived: true
      }
    });

    console.log('=== USUÁRIOS NO SISTEMA ===');
    users.forEach(user => {
      console.log(`\nID: ${user.id}`);
      console.log(`Nome: ${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      
      if (user.role === 'FREELANCER') {
        console.log(`Avaliações recebidas: ${user.freelancerReviewsReceived.length}`);
      } else {
        console.log(`Avaliações recebidas: ${user.clientReviewsReceived.length}`);
      }
    });

    console.log('\n=== AVALIAÇÕES ===');
    const freelancerReviews = await prisma.freelancerReview.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } },
        recipient: { select: { firstName: true, lastName: true } }
      }
    });

    const clientReviews = await prisma.clientReview.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } },
        recipient: { select: { firstName: true, lastName: true } }
      }
    });

    console.log(`\nFreelancer Reviews: ${freelancerReviews.length}`);
    freelancerReviews.forEach(review => {
      console.log(`- ${review.author.firstName} avaliou ${review.recipient.firstName}: ${review.rating} estrelas`);
    });

    console.log(`\nClient Reviews: ${clientReviews.length}`);
    clientReviews.forEach(review => {
      console.log(`- ${review.author.firstName} avaliou ${review.recipient.firstName}: ${review.rating} estrelas`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();