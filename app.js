const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const applyImageModifications = async (image, modificationType) => {
  switch (modificationType) {
    case 'make image brighter':
      image.brightness(0.3);
      break;
    case 'increase contrast':
      image.contrast(0.3);
      break;
    case 'make image b&w':
      image.greyscale();
      break;
    case 'invert image':
      image.invert();
      break;
    default:
      break;
  }
};

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

    const textData = {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };

    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('Text watermark added successfully.');
    startApp();
  } catch (error) {
    console.error('Something went wrong... Try again.');
  }
};

const addImageWatermarkToImage = async function (inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);

    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });

    await image.quality(100).writeAsync(outputFile);
    console.log('Image watermark added successfully.');
    startApp();
  } catch (error) {
    console.error('Something went wrong... Try again.');
  }
};

const prepareOutputFilename = (filename) => {
  const [name, ext] = filename.split('.');
  return `${name}-with-watermark.${ext}`;
};

const startApp = async () => {
  try {
    await fs.promises.access('./images'); // Checking the existence of the 'images' folder
  } catch (error) {
    await fs.promises.mkdir('./images'); // If it doesn't exist, create it
  }

  try {
    await fs.promises.access('./img'); // Checking the existence of the 'img' folder
  } catch (error) {
    await fs.promises.mkdir('./img'); // If it doesn't exist, create it
  }

  const answer = await inquirer.prompt([
    {
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm',
    },
  ]);

  if (!answer.start) process.exit();

  const options = await inquirer.prompt([
    {
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg',
    },
    {
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    },
  ]);

  const image = await Jimp.read(`./img/${options.inputImage}`);

  const modifyImage = await inquirer.prompt([
    {
      name: 'modify',
      type: 'confirm',
      message: 'Do you want to modify the image before adding a watermark?',
    },
  ]);

  if (modifyImage.modify) {
    const modificationType = await inquirer.prompt([
      {
        name: 'modificationType',
        type: 'list',
        message: 'Choose a modification:',
        choices: [
          'make image brighter',
          'increase contrast',
          'make image b&w',
          'invert image',
        ],
      },
    ]);

    await applyImageModifications(image, modificationType.modificationType);
  }

  if (options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([
      {
        name: 'value',
        type: 'input',
        message: 'Type your watermark text:',
      },
    ]);
    options.watermarkText = text.value;
    await addTextWatermarkToImage(`./img/${options.inputImage}`, `./images/${prepareOutputFilename(options.inputImage)}`, options.watermarkText); // Сохраняем в images
  } else {
    const image = await inquirer.prompt([
      {
        name: 'filename',
        type: 'input',
        message: 'Type your watermark name:',
        default: 'logo.png',
      },
    ]);
    options.watermarkImage = image.filename;
    await addImageWatermarkToImage(`./img/${options.inputImage}`, `./images/${prepareOutputFilename(options.inputImage)}`, `./img/${options.watermarkImage}`); // Сохраняем в images
  }
};

startApp();