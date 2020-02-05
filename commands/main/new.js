const { Command } = require('discord.js-commando');
const Occurrence = require('../../constants/occurrence');
const DateFormats = require('../../constants/dateFormat');
const moment = require ('moment');

module.exports = class NewCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'new',
			aliases: [],
			group: 'main',
			memberName: 'new',
            description: 'Starts a new stand-up event setup',
            args: [
                {
                    key: 'group_channel',
                    prompt: 'What group or channel would you like to include on this?',
                    type: 'string',
                }
            ]
		});
    }
    
    run(message, { group_channel }) {
        var newStandup = {};
        console.log(group_channel);
        message.say(`Got it ${message.author}! Check your DMs for more setup details.`);
        message.author.createDM().then((dm) => {
            this.getOccurrenceSetting(dm)
                .then(occurrence => {
                    newStandup.occurrence = occurrence;
                    this.getAskDatetime(dm)
                        .then(date => {
                            newStandup.first = date;
                            this.getReportDatetime(dm)
                                .then(date => {
                                    newStandup.report = date;
                                    this.getQuestions(dm)
                                        .then(questions => {
                                            newStandup.questions = questions;
                                            console.log(newStandup);
                                        })
                                        .catch(console.error);
                                })
                                .catch(console.error);
                        })
                        .catch(console.error);
                })
                .catch(console.error);
        });
    }

    getQuestions(dm) {
        dm.send("Now to add your questions!  To stop adding questions, just send the word `done`!")
        return this.getNextQuestion(dm, []);
    }

    getNextQuestion(dm, questions = []) {
        dm.send("Send your next question:")
        return new Promise((resolve, reject) => {
            const filter = m => m.author.id != this.client.user.id;
            dm.awaitMessages(filter, {max: 1, time: 180000, errors: ['time']})
                .then(collected => {
                    var question = collected.first().content;
                    if(question.toLowerCase() == 'done'){
                        resolve(questions);
                    }else{
                        questions.push(question);
                        this.getNextQuestion(dm, questions)
                            .then((questions) => { 
                                resolve(questions);
                            })
                            .catch(reject);
                    }
                })
                .catch(collected => {
                    dm.send("Looks like you may not be there anymore! Cancelling setup!");
                    reject();
                });
        });
    }

    getAskDatetime(dm) {
        const DATE_FORMAT = DateFormats.PARSE_FORMAT;
        var nowFormat = moment().format(DATE_FORMAT);
        return new Promise((resolve, reject) => {
            dm.send("What day and time do you want me to send the first message to the group?\n\nPlease provide in the following format `" + DATE_FORMAT + "`\ni.e. `" + nowFormat + "`");
            const filter = m => {
                if(m.author.id == this.client.user.id){
                    return false;
                }
                return moment.parseZone(m.content, DATE_FORMAT).isValid();
            }
            dm.awaitMessages(filter, {max: 1, time: 60000, errors: ['time']})
                .then(collected => {
                    var datetime = moment.parseZone(collected.first().content, DATE_FORMAT);
                    dm.send(`Okay, I will send the questions on ${datetime}`);
                    resolve(datetime);
                })
                .catch(collected => {
                    dm.send("No valid dates found, cancelling setup!");
                    reject();
                })
            
        });
    }

    getReportDatetime(dm) {
        const DATE_FORMAT = DateFormats.PARSE_FORMAT;
        var nowFormat = moment().format(DATE_FORMAT);
        return new Promise((resolve, reject) => {
            dm.send("What day and time do you want me to report on the first stand-up?\n\nPlease provide in the following format `" + DATE_FORMAT + "`\ni.e. `" + nowFormat + "`");
            const filter = m => {
                if(m.author.id == this.client.user.id){
                    return false;
                }
                return moment.parseZone(m.content, DATE_FORMAT).isValid();
            }
            dm.awaitMessages(filter, {max: 1, time: 60000, errors: ['time']})
                .then(collected => {
                    var datetime = moment.parseZone(collected.first().content, DATE_FORMAT);
                    dm.send(`Okay, I will send the report on ${datetime}`);
                    resolve(datetime);
                })
                .catch(collected => {
                    dm.send("No valid dates found, cancelling setup!");
                    reject();
                })
            
        });
    }

    getOccurrenceSetting(dm) {
        return new Promise((resolve, reject) => {
            dm.send("Let's create a new stand-up!\n\nHow often do you want it to occur?\n\n**1)** Daily\n**2)** Weekly\n**3)** Monthly\n\nRespond with the number of your choice!");
            const optionRegex = new RegExp('^[123]');
            const filter = m => {
                return optionRegex.test(m.content);
            };
            dm.awaitMessages(filter, {max: 1, time: 60000, errors: ['time']})
                .then(collected => {
                    var value = parseInt(collected.first().content, 10);
                    switch(value){
                        case Occurrence.DAILY:
                            dm.send("Daily, okay!");
                            resolve(Occurrence.DAILY);
                            break;
                        case Occurrence.WEEKLY:
                            dm.send("Weekly, okay!");
                            resolve(Occurrence.WEEKLY);
                            break;
                        case Occurrence.MONTHLY:
                            dm.send("Monthly, okay!");
                            resolve(Occurrence.MONTHLY);
                            break;
                        default:
                            dm.send("I didn't understand that, cancelling setup!");
                    }
                })
                .catch(collected => {
                    dm.send("No valid option found, cancelling setup!");
                    reject();
                });
        });
    }


};