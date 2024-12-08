const GOOGLE_API_KEY = 'AIzaSyBwZz_6igxGgJEJyk9N_VVGXOV9tKSIHpQ'; // not my api key lol

document.addEventListener('DOMContentLoaded', () => {
    const fontLinks = [
        'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Merriweather:wght@300;400;700&family=Open+Sans:wght@300;400;600&display=swap'
    ];
    fontLinks.forEach(link => {
        const fontLink = document.createElement('link');
        fontLink.href = link;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    });
});

const FONT_STYLES = [
    {
        family: "sans-serif",
        headingColor: "#2C3E50",
        textColor: "#34495E",
        accentColor: "#3498DB",
        styles: {
            heading: { fontWeight: "bold" },
            paragraph: { lineHeight: 1.6 }
        }
    },
    {
        family: "serif",
        headingColor: "#1A5F7A",
        textColor: "#2C3E50",
        accentColor: "#16A085",
        styles: {
            heading: { fontWeight: "bold" },
            paragraph: { lineHeight: 1.7 }
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
    
    if (reportCount < 1 || reportCount > 20) {
        alert('Please enter a number between 1 and 20');
        return;
    }

    storiesContainer.innerHTML = '';
    loading.classList.remove('hidden');
    loading.textContent = 'Generating reports...';

    try {
        const pdfPromises = [];
        const pdfFiles = [];

        for (let i = 0; i < reportCount; i++) {
            try {
                loading.textContent = `Generating report ${i + 1} of ${reportCount}...`;
                const fontStyle = FONT_STYLES[Math.floor(Math.random() * FONT_STYLES.length)];
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
                
                const pdfPromise = new Promise(async (resolve) => {
                    const pdf = new jspdf.jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });

                    const pageWidth = pdf.internal.pageSize.width;
                    const pageHeight = pdf.internal.pageSize.height;
                    const margin = 20;
                    const backgroundColor = generateSoftBackgroundColor();
                    pdf.setFillColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
                    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                    try {
                        pdf.addImage(imageBase64, 'JPEG', margin, margin, pageWidth - 2*margin, (pageWidth - 2*margin) * 9/16);
                    } catch (imgError) {
                        console.error('Image addition error:', imgError);
                    }
                    pdf.setFont("helvetica");
                    pdf.setFontSize(18);
                    pdf.setTextColor(0, 0, 0);  // Black color
                    pdf.text(imageData.title, pageWidth / 2, margin + (pageWidth - 2*margin) * 9/16 + 15, {
                        align: 'center'
                    });

                    // Report text
                    pdf.setFontSize(11);
                    pdf.setTextColor(50, 50, 50);  // Dark gray
                    
                    // Split text into lines
                    const paragraphs = report.split('\n').filter(p => p.trim() !== '');
                    let yPosition = margin + (pageWidth - 2*margin) * 9/16 + 25;
                    
                    paragraphs.forEach((paragraph, index) => {
                        const splitText = pdf.splitTextToSize(paragraph, pageWidth - 2*margin);
                        
                        // Add some spacing between paragraphs
                        if (index > 0) {
                            yPosition += 5;
                        }
                        
                        pdf.text(splitText, margin, yPosition, {
                            maxWidth: pageWidth - 2*margin,
                            align: 'justify'
                        });
                        
                        // Update y position
                        yPosition += splitText.length * 5;
                    });

                    // Convert PDF to Blob
                    const pdfBlob = pdf.output('blob');
                    const pdfFile = new File([pdfBlob], `report_${i + 1}_${imageData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
                    
                    resolve(pdfFile);
                });

                pdfPromises.push(pdfPromise);

                // Optional: Create a preview image (hidden)
                const previewImg = document.createElement('img');
                previewImg.src = imageData.url;
                previewImg.style.display = 'none'; // Hide the image
                storiesContainer.appendChild(previewImg);

            } catch (singleReportError) {
                console.error(`Error generating report ${i + 1}:`, singleReportError);
                continue;
            }
        }

        // Wait for all PDFs to be generated
        const generatedPDFs = await Promise.all(pdfPromises);

        // Create a ZIP file
        const zip = new JSZip();
        generatedPDFs.forEach(pdfFile => {
            zip.file(pdfFile.name, pdfFile);
        });

        // Generate the ZIP file
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(zipBlob);
        downloadLink.download = `reports_bundle_${new Date().toISOString().replace(/[:.]/g, '_')}.zip`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

    } catch (error) {
        console.error('Comprehensive Error:', error);
        alert(`Failed to generate reports. Error: ${error.message}`);
    } finally {
        loading.classList.add('hidden');
    }
}



function generateSoftBackgroundColor() {
    const pastelColors = [
        [240, 244, 248], // Soft Blue-Grey
        [230, 242, 255], // Light Sky Blue
        [243, 229, 245], // Pastel Lavender
        [232, 245, 233], // Mint Green
        [255, 243, 224], // Light Peach
        [255, 239, 230], // Pale Coral
        [240, 234, 245], // Pale Lilac
        [250, 240, 230], // Blush Beige
        [255, 250, 240], // Ivory
        [245, 245, 240], // Soft Vanilla
        [235, 245, 255], // Powder Blue
        [240, 250, 240], // Pale Mint
        [255, 244, 245], // Soft Pink
        [248, 239, 239], // Rose Dust
        [242, 243, 245], // Cloud Grey
        [240, 245, 255], // Baby Blue
        [248, 244, 252], // Lilac Mist
        [254, 247, 234], // Soft Sand
        [249, 250, 240], // Soft Lemon
        [245, 250, 245], // Light Seafoam
        [255, 255, 255], // Pure White
        [250, 250, 250], // Off-White
        [245, 245, 255], // Soft White-Blue
        [255, 245, 250], // Pale Pinkish White
        [248, 248, 255], // Lavender White
        [255, 253, 250], // Warm Ivory
        [252, 255, 250], // Pale Green White
        [255, 250, 255], // Orchid White
        [255, 255, 245], // Light Cream
        [255, 255, 230]  // Lemon White
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
