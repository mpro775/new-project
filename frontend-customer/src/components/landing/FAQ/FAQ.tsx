import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const FAQ: React.FC = () => {
  const { t } = useTranslation('landing');
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      id: 'q1',
      question: t('faq.q1.question'),
      answer: t('faq.q1.answer'),
    },
    {
      id: 'q2',
      question: t('faq.q2.question'),
      answer: t('faq.q2.answer'),
    },
    {
      id: 'q3',
      question: t('faq.q3.question'),
      answer: t('faq.q3.answer'),
    },
    {
      id: 'q4',
      question: t('faq.q4.question'),
      answer: t('faq.q4.answer'),
    },
    {
      id: 'q5',
      question: t('faq.q5.question'),
      answer: t('faq.q5.answer'),
    },
    {
      id: 'q6',
      question: t('faq.q6.question'),
      answer: t('faq.q6.answer'),
    },
  ];

  return (
    <Box
      id="faq"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            {t('faq.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {t('faq.subtitle')}
          </Typography>
        </Box>

        <Box>
          {faqs.map((faq) => (
            <Accordion
              key={faq.id}
              expanded={expanded === faq.id}
              onChange={handleChange(faq.id)}
              sx={{
                mb: 2,
                '&:before': {
                  display: 'none',
                },
                boxShadow: 1,
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    my: 2,
                  },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default FAQ;

