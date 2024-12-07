export const GOOGLE_API_KEY = 'AIzaSyCtLvx6ILJlAFYllUPp43kUl5QHSrZJsZ0';
const FONT_STYLES = [
    {
        family: "'Roboto', sans-serif",
        headingColor: "#2C3E50",
        textColor: "#34495E",
        accentColor: "#3498DB",
        styles: {
            heading: { fontWeight: "bold", textTransform: "uppercase" },
            paragraph: { lineHeight: "1.6", fontWeight: "normal" }
        }
    },
    {
        family: "'Merriweather', serif",
        headingColor: "#1A5F7A",
        textColor: "#2C3E50",
        accentColor: "#16A085",
        styles: {
            heading: { fontStyle: "italic", fontWeight: "bold" },
            paragraph: { lineHeight: "1.7", fontWeight: "300" }
        }
    },
    {
        family: "'Open Sans', sans-serif",
        headingColor: "#8E44AD",
        textColor: "#2C3E50",
        accentColor: "#E74C3C",
        styles: {
            heading: { textDecoration: "underline", fontWeight: "600" },
            paragraph: { lineHeight: "1.5", fontWeight: "400" }
        }
    }
];

const REPORT_TYPES = [
    {
        name: "Academic Analysis",
        template: (title, content) => {
            return content.split('\n').map(paragraph => 
                `<p style="text-align: justify; margin-bottom: 15px;">${formatAcademicText(paragraph)}</p>`
            ).join('');
        }
    },
    {
        name: "Creative Narrative",
        template: (title, content) => {
            return content.split('\n').map((paragraph, index) => 
                `<p style="text-align: ${index % 2 === 0 ? 'left' : 'right'}; margin-bottom: 15px; font-style: ${index % 3 === 0 ? 'italic' : 'normal'};">${formatNarrativeText(paragraph)}</p>`
            ).join('');
        }
    },
    {
        name: "Technical Report",
        template: (title, content) => {
            return content.split('\n').map(paragraph => 
                `<p style="text-align: justify; margin-bottom: 15px;">${formatTechnicalText(paragraph)}</p>`
            ).join('');
        }
    }
];

function formatAcademicText(text) {
    return text
        .replace(/\[(.*?)\]/g, '<strong>[$1]</strong>')
        .replace(/\{(.*?)\}/g, '<em>{$1}</em>');
}

function formatNarrativeText(text) {
    return text
        .replace(/\"(.*?)\"/g, '<em>"$1"</em>')
        .replace(/\*(.*?)\*/g, '<u>$1</u>');
}

function formatTechnicalText(text) {
    return text
        .replace(/\((.*?)\)/g, '<strong>($1)</strong>')
        .replace(/\[(.*?)\]/g, '<em>[$1]</em>');
}

async function generateReports() {
    const storiesContainer = document.getElementById('stories-container');
    const loading = document.getElementById('loading');
    const reportCount = parseInt(document.getElementById('reportCount').value) || 5;
    
    // Validate report count
    if (reportCount < 1 || reportCount > 20) {
        alert('Please enter a number between 1 and 20');
        return;
    }

    storiesContainer.innerHTML = '';
    loading.classList.remove('hidden');
    loading.textContent = 'Generating reports...';

    try {
        for (let i = 0; i < reportCount; i++) {
            try {
                loading.textContent = `Generating report ${i + 1} of ${reportCount}...`;

                const fontStyle = FONT_STYLES[Math.floor(Math.random() * FONT_STYLES.length)];
                const reportType = REPORT_TYPES[Math.floor(Math.random() * REPORT_TYPES.length)];

                let imageData;
                try {
                    imageData = await getRandomImageWithTitle();
                } catch (imageError) {
                    console.error('Image fetch error:', imageError);
                    imageData = {
                        url: 'https://via.placeholder.com/1920x1080.png?text=Report+Image',
                        title: 'Placeholder Image'
                    };
                }
                
                loading.textContent = `Analyzing image for report ${i + 1} of ${reportCount}...`;
                
                const imageResponse = await fetch(imageData.url);
                const imageBlob = await imageResponse.blob();
                const imageBase64 = await blobToBase64(imageBlob);

                const report = await generateReportWithGeminiVision(imageBase64, imageData.title);
                
                const reportPage = document.createElement('div');
                reportPage.className = 'report-page';
                reportPage.style.cssText = `
                    width: 210mm;
                    height: 297mm;
                    margin: 0 auto;
                    padding: 20mm;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-family: ${fontStyle.family};
                    background-color: ${generateSoftBackgroundColor()};
                    page-break-after: always;
                    position: relative;
                    overflow: hidden;
                `;
                
                reportPage.innerHTML = `
                    <h2 style="
                        text-align: center; 
                        margin-bottom: 20px; 
                        width: 100%; 
                        font-size: 24px;
                        color: ${fontStyle.headingColor};
                        font-weight: ${fontStyle.styles.heading.fontWeight};
                        font-style: ${fontStyle.styles.heading.fontStyle || 'normal'};
                        text-decoration: ${fontStyle.styles.heading.textDecoration || 'none'};
                        text-transform: ${fontStyle.styles.heading.textTransform || 'none'};
                    ">
                        ${imageData.title}
                    </h2>
                    <img src="${imageData.url}" style="max-width: 170mm; max-height: 200mm; object-fit: contain; margin-bottom: 20px; width: 100%; border: 3px solid ${fontStyle.accentColor};" alt="${imageData.title}">
                    <div style="
                        text-align: justify; 
                        line-height: ${fontStyle.styles.paragraph.lineHeight}; 
                        width: 100%; 
                        font-size: 12px;
                        color: ${fontStyle.textColor};
                        font-weight: ${fontStyle.styles.paragraph.fontWeight};
                    ">
                        ${reportType.template(imageData.title, report)}
                    </div>
                `;
                
                storiesContainer.appendChild(reportPage.cloneNode(true));

                loading.textContent = `Generating PDF for report ${i + 1} of ${reportCount}...`;

                await html2pdf()
                    .set({
                        margin: [0, 0, 0, 0],
                        filename: `${reportType.name.toLowerCase().replace(/\s+/g, '_')}_${i + 1}_${imageData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
                        image: { 
                            type: 'jpeg', 
                            quality: 0.98 
                        },
                        html2canvas: { 
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            letterRendering: true,
                            allowTaint: true
                        },
                        jsPDF: { 
                            unit: 'mm', 
                            format: 'a4', 
                            orientation: 'portrait' 
                        },
                        pagebreak: {
                            mode: ['css', 'legacy']
                        }
                    })
                    .from(reportPage)
                    .save();

                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (singleReportError) {
                console.error(`Error generating report ${i + 1}:`, singleReportError);
                continue;
            }
        }

    } catch (error) {
        console.error('Comprehensive Error:', error);
        alert(`Failed to generate reports. Error: ${error.message}`);
    } finally {
        loading.classList.add('hidden');
    }
}


function generateSoftBackgroundColor() {
    const pastelColors = [
        // Blues
        '#F0F4F8', '#E6F2FF', '#EDF2FB', '#E2ECF7', '#D4E5F9',
        // Pinks/Purples
        '#F3E5F5', '#FDE2E4', '#FAE0E4', '#F8E4FF', '#F1E6FF',
        // Greens
        '#E8F5E9', '#E2F0CB', '#DDEAD1', '#E9F5DB', '#F1F8E9',
        // Yellows/Oranges
        '#FFF3E0', '#FFF1E6', '#FAF3DD', '#FFF4D9', '#FFF8E7',
        // Mint/Aqua
        '#E0F7F6', '#E3FDFD', '#DEF7F7', '#E0FFFF', '#F0FFFF',
        // Beige/Cream
        '#F8F6F0', '#F7F3F0', '#FAF6F1', '#F9F7F7', '#F8F9FA'
    ];
    return pastelColors[Math.floor(Math.random() * pastelColors.length)];
}


async function getRandomImageWithTitle() {
    try {
        const imageUrl = 'https://picsum.photos/1920/1080';
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch random image');
        }

        const imageBlob = await response.clone().blob();
        const imageBase64 = await blobToBase64(imageBlob);

        const titleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Look at this image and provide exactly ONE short, creative title (3-6 words only). Do not provide multiple options or explanations. Response should only be the title." },
                        { 
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: imageBase64.split(',')[1]
                            }
                        }
                    ]
                }],
                generationConfig: {
                    maxOutputTokens: 32,
                    temperature: 0.7,
                    topP: 0.9
                }
            })
        });

        const titleData = await titleResponse.json();
        let title = titleData.candidates[0]?.content?.parts[0]?.text?.trim() || 'Untitled Image';
        
        title = title
            .replace(/^['"]*|['"]*$/g, '') 
            .replace(/^\*+|\*+$/g, '') 
            .replace(/^Title:?\s*/i, '') 
            .replace(/\n.*/g, '') 
            .trim();

        return {
            url: response.url,
            title: title
        };
    } catch (error) {
        console.error('Random Image API error:', error);
        return {
            url: 'https://via.placeholder.com/1920x1080.png?text=Report+Image',
            title: 'Unexpected Journey'
        };
    }
}



async function generateReportWithGeminiVision(imageBase64, imageTitle) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `Carefully analyze this image with the title "${imageTitle}". Create a detailed, professional report exploring the visual elements and potential narrative or significance. Write in a formal, academic tone with 3-4 paragraphs, each being 5-6 sentences long. Focus on descriptive analysis, potential interpretations, and contextual implications.` },
                        { 
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: imageBase64.split(',')[1]
                            }
                        }
                    ]
                }],
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.7,
                    topP: 0.9
                }
            })
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}: ${JSON.stringify(responseData)}`);
        }

        if (!responseData.candidates || responseData.candidates.length === 0) {
            throw new Error('No report candidates returned');
        }

        const report = responseData.candidates[0].content.parts[0].text;
        
        return report;
    } catch (error) {
        console.error('Detailed Gemini Vision API error:', error);
        return `Unable to generate report. Error: ${error.message}`;
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
