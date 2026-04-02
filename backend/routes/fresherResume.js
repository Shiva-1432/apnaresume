const express = require('express');
const { getGeminiModel, generateContentWithRetry } = require('../utils/ai');
const { authenticateToken } = require('../middleware/auth');
const { checkCredits } = require('../middleware/creditCheck');

const router = express.Router();

const fresherTemplates = {
  software_engineering: {
    sections: [
      'About',
      'Education',
      'Projects',
      'Skills',
      'Internships',
      'Competitions',
      'Certifications'
    ],
    content_guidelines: {
      About: "I'm a problem solver passionate about building scalable systems. Experienced with React, Node.js, and AWS.",
      Projects: [
        {
          title: 'E-commerce Platform',
          description: 'Built a full-stack e-commerce app using React, Node.js, MongoDB',
          impact: 'Implemented payment integration using Razorpay, 100+ test orders processed',
          github: 'github.com/...',
          tech_stack: 'React, Node.js, MongoDB, Razorpay'
        }
      ]
    }
  },
  data_science: {
    sections: [
      'About',
      'Education',
      'Projects',
      'Competitions',
      'Skills',
      'Certifications'
    ]
  },
  mechanical_engineering: {
    sections: [
      'About',
      'Education',
      'Major Projects',
      'Technical Skills',
      'Tools & Software',
      'Competitions',
      'Publications'
    ]
  }
};

router.post('/fresher-resume-builder', authenticateToken, checkCredits(1), async (req, res) => {
  try {
    const { role } = req.body;

    const fresherTemplate = fresherTemplates[role] || fresherTemplates.software_engineering;

    const prompt = `You're helping a fresher create a strong resume.

Template: ${JSON.stringify(fresherTemplate)}

Provide:
1. Suggestions for each section
2. Example bullet points for freshers
3. Tips on how to present projects effectively
4. What NOT to do (common mistakes)

Return as JSON:
{
  "sections": [
    {
      "name": "Projects",
      "description": "Projects are your main weapon as a fresher",
      "tips": ["Include metrics", "Show GitHub link", "Mention impact"],
      "examples": ["..."]
    }
  ],
  "dos_and_donts": {
    "do": ["Include college achievements", "Quantify impact"],
    "dont": ["Lie about experience", "Generic descriptions"]
  }
}`;

    // Use centralized AI model
    const model = getGeminiModel('gemini-pro');
    const guidance = await generateContentWithRetry(model, prompt);
    const guidanceText = guidance.response.text();
    const jsonMatch = guidanceText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }
    const guideData = JSON.parse(jsonMatch[0]);

    // Deduct credits
    const user = req.fullUser;
    user.credits -= 1;
    await user.save();

    return res.json({
      success: true,
      template: fresherTemplate,
      guidance: guideData,
      credits_remaining: user.credits,
      message: 'Fresher-focused resume template loaded'
    });
  } catch (error) {
    console.error('Fresher template error:', error);
    return res.status(500).json({ error: 'Failed to load template' });
  }
});

module.exports = router;
