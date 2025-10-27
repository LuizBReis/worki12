async function testLogin() {
  try {
    console.log('🔐 Testando login...');
    
    // 1. Fazer login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'guegue@reis',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();

    console.log('✅ Login bem-sucedido!');
    console.log('Token:', loginData.token);
    console.log('Usuário:', loginData.user);

    const token = loginData.token;
    const userId = loginData.user.id;

    // 2. Testar buscar perfil do usuário
    console.log('\n📋 Testando busca de perfil...');
    const profileResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const profileData = await profileResponse.json();

    console.log('✅ Perfil obtido com sucesso!');
    console.log('Nome:', profileData.firstName, profileData.lastName);
    console.log('Role:', profileData.role);
    
    // Log completo dos dados recebidos
    console.log('\n🔍 DADOS COMPLETOS DO PERFIL:');
    console.log(JSON.stringify(profileData, null, 2));
    
    if (profileData.role === 'FREELANCER') {
      console.log('\n⭐ FREELANCER DATA:');
      console.log('averageFreelancerRating:', profileData.averageFreelancerRating);
      console.log('freelancerReviewsReceived:', profileData.freelancerReviewsReceived);
      console.log('Número de avaliações recebidas:', profileData.freelancerReviewsReceived?.length || 0);
      
      if (profileData.freelancerReviewsReceived?.length > 0) {
        console.log('📋 Avaliações recebidas:');
        profileData.freelancerReviewsReceived.forEach((review, index) => {
          console.log(`  ${index + 1}. ${review.rating} estrelas - "${review.comment}" por ${review.author.firstName}`);
        });
      }
    }

    if (profileData.role === 'CLIENT') {
      console.log('\n⭐ CLIENT DATA:');
      console.log('averageRating:', profileData.averageRating);
      console.log('receivedReviews:', profileData.receivedReviews);
      console.log('Número de avaliações recebidas:', profileData.receivedReviews?.length || 0);
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testLogin();