const skillService = require('../services/skillService');

const listSuggestedSkills = async (req, res) => {
  try {
    const skills = await skillService.getSuggestedSkills();
    res.status(200).json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sugestões de skills.', error: error.message });
  }
};

module.exports = {
  listSuggestedSkills,
};