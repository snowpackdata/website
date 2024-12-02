const featuresTabOne = document.getElementById('features-tab-1');
const featuresTabTwo = document.getElementById('features-tab-2');
const featuresTabThree = document.getElementById('features-tab-3');
const featuresTabFour = document.getElementById('features-tab-4');

const featuresPanelOne = document.getElementById('features-panel-1');
const featuresPanelTwo = document.getElementById('features-panel-2');
const featuresPanelThree = document.getElementById('features-panel-3');
const featuresPanelFour = document.getElementById('features-panel-4');

featuresTabOne.addEventListener('click', () => {
    featuresTabOne.classList.add('active');
    featuresTabTwo.classList.remove('active');
    featuresTabThree.classList.remove('active');
    featuresTabFour.classList.remove('active');

    featuresPanelOne.classList.remove('hidden');
    featuresPanelTwo.classList.add('hidden');
    featuresPanelThree.classList.add('hidden');
    featuresPanelFour.classList.add('hidden');
});

featuresTabTwo.addEventListener('click', () => {
    featuresTabOne.classList.remove('active');
    featuresTabTwo.classList.add('active');
    featuresTabThree.classList.remove('active');
    featuresTabFour.classList.remove('active');

    featuresPanelOne.classList.add('hidden');
    featuresPanelTwo.classList.remove('hidden');
    featuresPanelThree.classList.add('hidden');
    featuresPanelFour.classList.add('hidden');
});

featuresTabThree.addEventListener('click', () => {
    featuresTabOne.classList.remove('active');
    featuresTabTwo.classList.remove('active');
    featuresTabThree.classList.add('active');
    featuresTabFour.classList.remove('active');

    featuresPanelOne.classList.add('hidden');
    featuresPanelTwo.classList.add('hidden');
    featuresPanelThree.classList.remove('hidden');
    featuresPanelFour.classList.add('hidden');
});

featuresTabFour.addEventListener('click', () => {
    featuresTabOne.classList.remove('active');
    featuresTabTwo.classList.remove('active');
    featuresTabThree.classList.remove('active');
    featuresTabFour.classList.add('active');

    featuresPanelOne.classList.add('hidden');
    featuresPanelTwo.classList.add('hidden');
    featuresPanelThree.classList.add('hidden');
    featuresPanelFour.classList.remove('hidden');
});

