const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedReviews() {
  console.log('Iniciando seed de avaliações...');

  try {
    // Buscar usuários existentes
    const users = await prisma.user.findMany({
      include: {
        freelancerProfile: true,
        clientProfile: true
      }
    });

    if (users.length < 2) {
      console.log('Não há usuários suficientes para criar avaliações. Criando usuários de teste...');
      
      // Criar usuário freelancer
      const freelancer = await prisma.user.create({
        data: {
          email: 'freelancer@test.com',
          firstName: 'João',
          lastName: 'Silva',
          password: '$2a$10$example', // senha hash de exemplo
          role: 'FREELANCER',
          freelancerProfile: {
            create: {
              description: 'Desenvolvedor Full Stack com 5 anos de experiência'
            }
          }
        }
      });

      // Criar usuário cliente
      const client = await prisma.user.create({
        data: {
          email: 'client@test.com',
          firstName: 'Maria',
          lastName: 'Santos',
          password: '$2a$10$example', // senha hash de exemplo
          role: 'CLIENT',
          clientProfile: {
            create: {
              companyName: 'Tech Solutions Ltda',
              description: 'Empresa de soluções tecnológicas'
            }
          }
        }
      });

      // Criar job e application para poder criar reviews
      const job = await prisma.job.create({
        data: {
          title: 'Desenvolvimento de Website',
          description: 'Desenvolvimento de um website responsivo',
          budget: 2000,
          authorId: client.clientProfile.id,
          skills: {
            connect: []
          }
        }
      });

      const application = await prisma.jobApplication.create({
        data: {
          jobId: job.id,
          applicantId: freelancer.id,
          jobStatus: 'COMPLETED'
        }
      });

      // Criar avaliação do cliente para o freelancer
      await prisma.freelancerReview.create({
        data: {
          rating: 5,
          comment: 'Excelente trabalho! Muito profissional e entregou no prazo.',
          applicationId: application.id,
          authorId: client.id,
          recipientId: freelancer.id
        }
      });

      // Criar avaliação do freelancer para o cliente
      await prisma.clientReview.create({
        data: {
          rating: 4,
          comment: 'Cliente muito atencioso e pagou em dia. Recomendo!',
          applicationId: application.id,
          authorId: freelancer.id,
          recipientId: client.id
        }
      });

      console.log('Usuários e avaliações de teste criados com sucesso!');
    } else {
      console.log(`Encontrados ${users.length} usuários existentes.`);
      
      // Se já existem usuários, vamos tentar criar avaliações entre eles
      const freelancers = users.filter(u => u.role === 'FREELANCER');
      const clients = users.filter(u => u.role === 'CLIENT');

      if (freelancers.length > 0 && clients.length > 0) {
        const freelancer = freelancers[0];
        const client = clients[0];

        // Verificar se já existe job e application
        let job = await prisma.job.findFirst({
          where: { authorId: client.clientProfile?.id }
        });

        if (!job && client.clientProfile) {
          job = await prisma.job.create({
            data: {
              title: 'Projeto de Teste',
              description: 'Projeto para testar avaliações',
              budget: 1000,
              authorId: client.clientProfile.id,
              skills: {
                connect: []
              }
            }
          });
        }

        if (job) {
          let application = await prisma.jobApplication.findFirst({
            where: {
              jobId: job.id,
              applicantId: freelancer.id
            }
          });

          if (!application) {
            application = await prisma.jobApplication.create({
              data: {
                jobId: job.id,
                applicantId: freelancer.id,
                jobStatus: 'COMPLETED'
              }
            });
          }

          // Verificar se já existem avaliações
          const existingFreelancerReview = await prisma.freelancerReview.findUnique({
            where: { applicationId: application.id }
          });

          const existingClientReview = await prisma.clientReview.findUnique({
            where: { applicationId: application.id }
          });

          if (!existingFreelancerReview) {
            await prisma.freelancerReview.create({
              data: {
                rating: 5,
                comment: 'Trabalho excepcional!',
                applicationId: application.id,
                authorId: client.id,
                recipientId: freelancer.id
              }
            });
            console.log('Avaliação do freelancer criada!');
          }

          if (!existingClientReview) {
            await prisma.clientReview.create({
              data: {
                rating: 4,
                comment: 'Cliente muito bom de trabalhar!',
                applicationId: application.id,
                authorId: freelancer.id,
                recipientId: client.id
              }
            });
            console.log('Avaliação do cliente criada!');
          }
        }
      }
    }

    console.log('Seed de avaliações concluído!');
  } catch (error) {
    console.error('Erro ao criar avaliações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReviews();