const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Replace Málaga Amiga / Malaga Amiga
    content = content.replace(/Málaga Amiga/g, 'Gravita');
    content = content.replace(/Malaga Amiga/g, 'Gravita');
    content = content.replace(/malaga amiga/gi, 'Gravita');
    content = content.replace(/MalagaAmiga/g, 'Gravita');
    content = content.replace(/málaga amiga/gi, 'Gravita');
    content = content.replace(/MálagaAmiga/g, 'Gravita');

    // Remove **Grupo de Coordinación**
    // Original text: Una vez te apuntes al plan, se activará el **Grupo de Coordinación** de esta tarjeta para que hables con el anfitrión, el resto del grupo y nuestra asistente IA.
    // Let's replace it entirely or just remove "**Grupo de Coordinación**". The user said:
    // "tambien elimina el **Grupo de Coordinacion**"
    // So we can change the sentence to: "Una vez te apuntes al plan, se activará el chat de esta tarjeta para que hables con el anfitrión, el resto del grupo y nuestra asistente IA."
    content = content.replace(/\*\*Grupo de Coordinación\*\*/g, 'chat');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Updated', filePath);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (fullPath !== 'node_modules' && !fullPath.startsWith('.git') && fullPath !== 'dist') {
                traverse(fullPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.json') || fullPath.endsWith('.html')) {
            replaceInFile(fullPath);
        }
    }
}

traverse('./src');
traverse('./');
