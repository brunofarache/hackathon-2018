const googleDetect = require('./google');

const goodWords = ['fun', 'sports', 'health food', 'dog', 'puppy', 'vegetable', 'salad', 'leaf vegetable', 'spinach salad', 'vegetarian food', 'superfood', 'caesar salad', 'asian food', 'muscle', 'ultramarathon', 'race', 'running', 'trail', 'duathlon', 'endurance sports', 'long distance running', 'athletics', 'gym', 'exercise equipment'];
const badWords = ['junk food', 'nightclub', 'milkshake', 'fast food', 'french fries', 'burguer', 'cigarret', 'tobacco', 'cigar', 'tobacco products', 'tobacco product', 'obesity']

const getTagIndex = (words, tag) => {
	return words.reduce((prev, {keyword}, index, original) => {
		if(keyword == tag){
			prev = index;
		}

		return prev;
	}, null);
}

const predict = (res, images) => {
	Promise.all(images.map(googleDetect)).then(data => {
		const result = data.reduce((prev, next, index, original)=> {
			next.map(tag => {
				const badIndex = getTagIndex(prev.bad, tag);
				const goodIndex = getTagIndex(prev.good, tag);

				if(badWords.indexOf(tag) != -1) {
					prev.totalBad += 1;

					if(typeof badIndex == 'number'){
						prev.bad[badIndex].occurrencies += 1;
					}else {
						prev.bad.push({
							keyword: tag,
							occurrencies: 1
						})
					}
				}else if(goodWords.indexOf(tag) != -1){
					prev.totalGood += 1;

					if(typeof goodIndex == 'number'){
						prev.good[goodIndex].occurrencies += 1;
					}else {
						prev.good.push({
							keyword: tag,
							occurrencies: 1
						})
					}
				}
			})
			
			return prev;
		}, {
			bad:[],
			good: [],
			totalBad: 0,
			totalGood: 0
		});

		result.score = result.totalGood / (result.totalGood + result.totalBad);

		res.send({
			status: 'success',
			result
		})
	})
}

module.exports = {predict};